import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { RULE_CATEGORIES, RULES, Rule, RuleCategory, RuleCallout } from '@/data/rules';
import { recordAuditEvent } from '@/lib/audit/audit-logger';

export interface DbRuleCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbRule {
  id: string;
  category_id: string;
  rule_number?: number;
  title: string;
  short_title?: string;
  short_description?: string;
  content: string;
  aliases: string[];
  featured: boolean;
  core_rule_number?: number;
  severity?: string;
  callouts: RuleCallout[];
  sort_order: number;
  enabled: boolean;
  status?: 'published' | 'draft' | 'modified' | 'archived';
  has_draft?: boolean;
  draft_action?: 'create' | 'update' | 'delete';
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbRuleDraft {
  id: string;
  rule_id: string;
  category_id: string;
  rule_number?: number;
  title: string;
  short_title?: string;
  short_description?: string;
  content: string;
  aliases: string[];
  featured: boolean;
  core_rule_number?: number;
  severity?: string;
  callouts: RuleCallout[];
  sort_order: number;
  enabled: boolean;
  action: 'create' | 'update' | 'delete';
  created_by_discord_id: string;
  created_by_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbRuleVersion {
  id: string;
  version_number: number;
  snapshot: {
    categories: DbRuleCategory[];
    rules: DbRule[];
  };
  published_by_discord_id: string;
  published_by_display_name: string;
  publish_note: string;
  changes_summary: any[];
  published_at: string;
}

export interface StagedChangeSummary {
  rule_id: string;
  title: string;
  category_id: string;
  action: 'create' | 'update' | 'delete';
  before?: Partial<DbRule> | null;
  after?: Partial<DbRule> | null;
}

// In-memory fallback storage when Supabase tables are not yet initialized
let memCategories: DbRuleCategory[] = RULE_CATEGORIES.map((c, idx) => ({
  id: c.id,
  title: c.title,
  description: c.description,
  icon: c.iconName,
  sort_order: idx + 1,
  enabled: true,
}));

let memRules: DbRule[] = RULES.map((r, idx) => ({
  id: r.id,
  category_id: r.category,
  rule_number: idx + 1,
  title: r.title,
  short_title: r.shortTitle,
  short_description: r.summary,
  content: r.content,
  aliases: r.aliases || [],
  featured: Boolean(r.featured),
  core_rule_number: r.coreRuleNumber,
  severity: 'standard',
  callouts: r.callouts || [],
  sort_order: idx + 1,
  enabled: true,
  status: 'published',
  has_draft: false,
  deleted_at: null,
}));

let memDrafts: Map<string, DbRuleDraft> = new Map();
let memVersions: DbRuleVersion[] = [
  {
    id: 'v1-initial',
    version_number: 1,
    snapshot: {
      categories: [...memCategories],
      rules: [...memRules],
    },
    published_by_discord_id: '150580708144840704',
    published_by_display_name: 'Damon',
    publish_note: 'Initial official server rules and constitutional legislation snapshot.',
    changes_summary: [{ type: 'initial', count: memRules.length }],
    published_at: new Date('2026-09-01T00:00:00Z').toISOString(),
  },
];
let memHistory: any[] = [];

/**
 * Automated idempotent seed function to import existing website rules into Supabase.
 * Checks whether Supabase tables have any categories or rules.
 * If empty, it populates all 9 categories, all 31 rules, and Version 1 snapshot.
 */
export async function seedExistingRulesIfEmpty(
  supabaseClient?: any,
  force = false
): Promise<{ success: boolean; message: string; categoriesCount: number; rulesCount: number }> {
  const supabase = supabaseClient || createAdminClient();
  if (!supabase) {
    return { success: false, message: 'Supabase client unavailable', categoriesCount: 0, rulesCount: 0 };
  }

  try {
    const { data: existingCats, error: catCheckErr } = await supabase
      .from('rule_categories')
      .select('id')
      .limit(1);

    if (catCheckErr) {
      return { success: false, message: `Tables not ready: ${catCheckErr.message}`, categoriesCount: 0, rulesCount: 0 };
    }

    if (force || !existingCats || existingCats.length === 0) {
      console.log('[SupabaseRules] Populating Supabase with existing website rules...');

      // Upsert all 9 categories
      const catRows = RULE_CATEGORIES.map((c, idx) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        icon: c.iconName,
        sort_order: idx + 1,
        enabled: true,
        updated_at: new Date().toISOString(),
      }));
      const { error: catErr } = await supabase.from('rule_categories').upsert(catRows, { onConflict: 'id' });
      if (catErr) {
        console.error('[SupabaseRules] Error upserting categories:', catErr);
      }

      // Upsert all 31 rules
      const ruleRows = RULES.map((r, idx) => ({
        id: r.id,
        category_id: r.category,
        rule_number: idx + 1,
        title: r.title,
        short_title: r.shortTitle || r.title,
        short_description: r.summary || '',
        content: r.content,
        aliases: r.aliases || [],
        featured: Boolean(r.featured),
        core_rule_number: r.coreRuleNumber || null,
        severity: 'standard',
        callouts: r.callouts || [],
        sort_order: idx + 1,
        enabled: true,
        updated_at: new Date().toISOString(),
      }));
      const { error: rulesErr } = await supabase.from('rules').upsert(ruleRows, { onConflict: 'id' });
      if (rulesErr) {
        console.error('[SupabaseRules] Error upserting rules:', rulesErr);
      }

      // Check if version 1 exists
      const { data: existingVers } = await supabase
        .from('rule_versions')
        .select('id')
        .eq('version_number', 1)
        .maybeSingle();

      if (!existingVers) {
        await supabase.from('rule_versions').insert({
          version_number: 1,
          snapshot: {
            categories: catRows,
            rules: ruleRows,
          },
          published_by_discord_id: '150580708144840704',
          published_by_display_name: 'Damon',
          publish_note: 'Initial Rules CMS migration from public website.',
          changes_summary: [{ type: 'initial_migration', count: ruleRows.length }],
          published_at: new Date().toISOString(),
        });
      }

      await recordAuditEvent({
        discordUserId: '150580708144840704',
        displayName: 'System (Migration)',
        action: 'rules.initial_migration',
        target: 'rules',
        details: 'Imported 31 existing website rules across 9 categories into Supabase (Version 1)',
      });

      console.log('[SupabaseRules] Successfully completed automated initial seed of 31 rules and 9 categories!');
      return {
        success: true,
        message: 'Successfully seeded 31 rules across 9 categories into Supabase',
        categoriesCount: catRows.length,
        rulesCount: ruleRows.length,
      };
    }

    return {
      success: true,
      message: 'Supabase rules already exist, skipping duplicate insert',
      categoriesCount: existingCats.length,
      rulesCount: 31,
    };
  } catch (err: any) {
    console.error('[SupabaseRules] Error during seeding:', err);
    return { success: false, message: err.message, categoriesCount: 0, rulesCount: 0 };
  }
}

/**
 * Get active published rules and categories for the public Rules page.
 */
export async function getPublishedRulesAndCategories(): Promise<{
  categories: DbRuleCategory[];
  rules: DbRule[];
  versionNumber: number;
}> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      let [catsRes, rulesRes, verRes] = await Promise.all([
        supabase
          .from('rule_categories')
          .select('*')
          .eq('enabled', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('rules')
          .select('*')
          .is('deleted_at', null)
          .eq('enabled', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('rule_versions')
          .select('version_number')
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      // If table exists but is empty, automatically seed and re-query
      if (!catsRes.error && catsRes.data && catsRes.data.length === 0) {
        const seedResult = await seedExistingRulesIfEmpty(supabase);
        if (seedResult.success && seedResult.categoriesCount > 0) {
          [catsRes, rulesRes, verRes] = await Promise.all([
            supabase
              .from('rule_categories')
              .select('*')
              .eq('enabled', true)
              .order('sort_order', { ascending: true }),
            supabase
              .from('rules')
              .select('*')
              .is('deleted_at', null)
              .eq('enabled', true)
              .order('sort_order', { ascending: true }),
            supabase
              .from('rule_versions')
              .select('version_number')
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
        }
      }

      if (!catsRes.error && catsRes.data && catsRes.data.length > 0 && !rulesRes.error && rulesRes.data && rulesRes.data.length > 0) {
        return {
          categories: catsRes.data,
          rules: rulesRes.data,
          versionNumber: verRes.data?.version_number || 1,
        };
      }
    } catch (err) {
      console.warn('[SupabaseRules] Error fetching published rules from DB, using fallback memory state:', err);
    }
  }

  // Graceful fallback to initial memory snapshot
  return {
    categories: memCategories.filter((c) => c.enabled),
    rules: memRules.filter((r) => r.enabled && !r.deleted_at),
    versionNumber: memVersions[memVersions.length - 1]?.version_number || 1,
  };
}

/**
 * Get all rules and categories for Admin Console (includes draft modifications and status badges).
 */
export async function getAllRulesForAdmin(): Promise<{
  categories: DbRuleCategory[];
  rules: DbRule[];
  draftsCount: number;
  publishedCount: number;
  currentVersion: number;
  lastPublishedAt?: string;
  lastPublishedBy?: string;
}> {
  const supabase = createAdminClient();

  let categories: DbRuleCategory[] = [];
  let rules: DbRule[] = [];
  let drafts: DbRuleDraft[] = [];
  let currentVersion = 1;
  let lastPublishedAt = memVersions[memVersions.length - 1]?.published_at;
  let lastPublishedBy = memVersions[memVersions.length - 1]?.published_by_display_name;

  if (supabase) {
    try {
      let [catsRes, rulesRes, draftsRes, verRes] = await Promise.all([
        supabase.from('rule_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('rules').select('*').order('sort_order', { ascending: true }),
        supabase.from('rules_draft').select('*').order('updated_at', { ascending: false }),
        supabase
          .from('rule_versions')
          .select('*')
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      // If table exists but is empty, auto-seed
      if (!catsRes.error && catsRes.data && catsRes.data.length === 0) {
        const seedResult = await seedExistingRulesIfEmpty(supabase);
        if (seedResult.success && seedResult.categoriesCount > 0) {
          [catsRes, rulesRes, draftsRes, verRes] = await Promise.all([
            supabase.from('rule_categories').select('*').order('sort_order', { ascending: true }),
            supabase.from('rules').select('*').order('sort_order', { ascending: true }),
            supabase.from('rules_draft').select('*').order('updated_at', { ascending: false }),
            supabase
              .from('rule_versions')
              .select('*')
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
        }
      }

      if (!catsRes.error && catsRes.data && catsRes.data.length > 0) {
        categories = catsRes.data;
      }
      if (!rulesRes.error && rulesRes.data && rulesRes.data.length > 0) {
        rules = rulesRes.data;
      }
      if (!draftsRes.error && draftsRes.data) {
        drafts = draftsRes.data;
      }
      if (verRes.data) {
        currentVersion = verRes.data.version_number;
        lastPublishedAt = verRes.data.published_at;
        lastPublishedBy = verRes.data.published_by_display_name;
      }
    } catch (err) {
      console.warn('[SupabaseRules] Admin fetch DB error, using memory fallback:', err);
    }
  }

  // Fallback if DB empty
  if (categories.length === 0) categories = [...memCategories];
  if (rules.length === 0) rules = [...memRules];
  if (drafts.length === 0) drafts = Array.from(memDrafts.values());

  // Merge drafts with rules
  const draftMap = new Map<string, DbRuleDraft>();
  drafts.forEach((d) => draftMap.set(d.rule_id, d));

  const mergedRules: DbRule[] = rules.map((r) => {
    const draft = draftMap.get(r.id);
    if (draft) {
      return {
        ...r,
        ...draft,
        id: r.id,
        status: draft.action === 'delete' ? 'archived' : 'modified',
        has_draft: true,
        draft_action: draft.action,
      };
    }
    return {
      ...r,
      status: r.deleted_at ? 'archived' : r.enabled ? 'published' : 'draft',
      has_draft: false,
    };
  });

  // Also include drafts that are completely new rules not yet in rules table
  const existingIds = new Set(rules.map((r) => r.id));
  drafts.forEach((d) => {
    if (!existingIds.has(d.rule_id) && d.action === 'create') {
      mergedRules.push({
        id: d.rule_id,
        category_id: d.category_id,
        rule_number: d.rule_number,
        title: d.title,
        short_title: d.short_title,
        short_description: d.short_description,
        content: d.content,
        aliases: d.aliases || [],
        featured: Boolean(d.featured),
        core_rule_number: d.core_rule_number,
        severity: d.severity || 'standard',
        callouts: d.callouts || [],
        sort_order: d.sort_order || 99,
        enabled: d.enabled,
        status: 'draft',
        has_draft: true,
        draft_action: 'create',
      });
    }
  });

  return {
    categories,
    rules: mergedRules,
    draftsCount: drafts.length,
    publishedCount: rules.filter((r) => !r.deleted_at && r.enabled).length,
    currentVersion,
    lastPublishedAt,
    lastPublishedBy,
  };
}

/**
 * Save or update a draft rule.
 */
export async function saveRuleDraft(
  draftData: Partial<DbRuleDraft> & { rule_id: string; title: string; content: string; category_id: string },
  user: { discordId: string; displayName: string }
): Promise<{ success: boolean; draft: DbRuleDraft }> {
  const supabase = createAdminClient();

  const draft: DbRuleDraft = {
    id: draftData.id || `draft-${Date.now()}`,
    rule_id: draftData.rule_id,
    category_id: draftData.category_id,
    rule_number: draftData.rule_number,
    title: draftData.title,
    short_title: draftData.short_title || draftData.title,
    short_description: draftData.short_description || '',
    content: draftData.content,
    aliases: draftData.aliases || [],
    featured: Boolean(draftData.featured),
    core_rule_number: draftData.core_rule_number,
    severity: draftData.severity || 'standard',
    callouts: draftData.callouts || [],
    sort_order: draftData.sort_order ?? 0,
    enabled: draftData.enabled ?? true,
    action: draftData.action || 'update',
    created_by_discord_id: user.discordId,
    created_by_name: user.displayName,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const payload = {
        rule_id: draft.rule_id,
        category_id: draft.category_id,
        rule_number: draft.rule_number,
        title: draft.title,
        short_title: draft.short_title,
        short_description: draft.short_description,
        content: draft.content,
        aliases: draft.aliases,
        featured: draft.featured,
        core_rule_number: draft.core_rule_number,
        severity: draft.severity,
        callouts: draft.callouts,
        sort_order: draft.sort_order,
        enabled: draft.enabled,
        action: draft.action,
        created_by_discord_id: user.discordId,
        created_by_name: user.displayName,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('rules_draft')
        .select('id')
        .eq('rule_id', draft.rule_id)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('rules_draft')
          .update(payload)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('rules_draft')
          .insert(payload);
      }
    } catch (err) {
      console.warn('[SupabaseRules] Error writing rule draft to DB:', err);
    }
  }

  // Update memory store
  memDrafts.set(draft.rule_id, draft);

  // Record change history
  await recordRuleChangeHistory({
    rule_id: draft.rule_id,
    action: draft.action === 'create' ? 'created' : 'updated',
    after_data: draft,
    changed_by_discord_id: user.discordId,
    changed_by_display_name: user.displayName,
  });

  return { success: true, draft };
}

/**
 * Discard an active draft.
 */
export async function discardRuleDraft(
  ruleId: string,
  user: { discordId: string; displayName: string }
): Promise<boolean> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      await supabase.from('rules_draft').delete().eq('rule_id', ruleId);
    } catch (err) {
      console.warn('[SupabaseRules] Error deleting draft from DB:', err);
    }
  }

  memDrafts.delete(ruleId);

  await recordAuditEvent({
    discordUserId: user.discordId,
    displayName: user.displayName,
    action: 'rule.draft_discarded',
    target: ruleId,
    details: `Draft changes for rule ${ruleId} were discarded.`,
  });

  return true;
}

/**
 * Inspect staged changes and build a diff summary before publishing.
 */
export async function getStagedChangesSummary(): Promise<StagedChangeSummary[]> {
  const supabase = createAdminClient();
  let drafts: DbRuleDraft[] = [];
  let existingRules: DbRule[] = [];

  if (supabase) {
    try {
      const [draftsRes, rulesRes] = await Promise.all([
        supabase.from('rules_draft').select('*'),
        supabase.from('rules').select('*'),
      ]);
      if (draftsRes.data) drafts = draftsRes.data;
      if (rulesRes.data) existingRules = rulesRes.data;
    } catch {
      // Fallback
    }
  }

  if (drafts.length === 0) drafts = Array.from(memDrafts.values());
  if (existingRules.length === 0) existingRules = memRules;

  const existingMap = new Map(existingRules.map((r) => [r.id, r]));

  return drafts.map((draft) => {
    const existing = existingMap.get(draft.rule_id);
    return {
      rule_id: draft.rule_id,
      title: draft.title,
      category_id: draft.category_id,
      action: draft.action,
      before: existing
        ? {
            title: existing.title,
            rule_number: existing.rule_number,
            content: existing.content,
            category_id: existing.category_id,
            enabled: existing.enabled,
          }
        : null,
      after: {
        title: draft.title,
        rule_number: draft.rule_number,
        content: draft.content,
        category_id: draft.category_id,
        enabled: draft.enabled,
      },
    };
  });
}

/**
 * Publish all staged drafts:
 * 1. Merges drafts into live `rules` table.
 * 2. Creates a full version snapshot in `rule_versions`.
 * 3. Deletes processed drafts.
 * 4. Logs audit event.
 */
export async function publishStagedChanges(
  publishNote: string,
  user: { discordId: string; displayName: string }
): Promise<{ success: boolean; versionNumber: number; summary: StagedChangeSummary[] }> {
  const summary = await getStagedChangesSummary();
  if (summary.length === 0) {
    throw new Error('No staged draft changes found to publish.');
  }

  const supabase = createAdminClient();
  let nextVersion = memVersions.length + 1;

  if (supabase) {
    try {
      const { data: latestVer } = await supabase
        .from('rule_versions')
        .select('version_number')
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestVer) {
        nextVersion = latestVer.version_number + 1;
      }
    } catch {
      // ignore
    }
  }

  // Apply changes to rules table & memory
  for (const item of summary) {
    if (item.action === 'delete') {
      if (supabase) {
        await supabase
          .from('rules')
          .update({ deleted_at: new Date().toISOString(), deleted_by: user.displayName })
          .eq('id', item.rule_id);
      }
      const existing = memRules.find((r) => r.id === item.rule_id);
      if (existing) {
        existing.deleted_at = new Date().toISOString();
        existing.deleted_by = user.displayName;
      }
    } else {
      const payload: Partial<DbRule> = {
        id: item.rule_id,
        category_id: item.after?.category_id || 'general',
        rule_number: item.after?.rule_number,
        title: item.after?.title || 'Rule',
        content: item.after?.content || '',
        enabled: item.after?.enabled ?? true,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from('rules').upsert(payload, { onConflict: 'id' });
      }

      const existingIdx = memRules.findIndex((r) => r.id === item.rule_id);
      if (existingIdx >= 0) {
        memRules[existingIdx] = { ...memRules[existingIdx], ...payload };
      } else {
        memRules.push({
          id: item.rule_id,
          category_id: payload.category_id!,
          title: payload.title!,
          content: payload.content!,
          aliases: [],
          featured: false,
          callouts: [],
          sort_order: memRules.length + 1,
          enabled: payload.enabled!,
          deleted_at: null,
        });
      }
    }
  }

  // Build full snapshot
  const snapshot = {
    categories: [...memCategories],
    rules: memRules.filter((r) => !r.deleted_at),
  };

  const versionRecord: DbRuleVersion = {
    id: `ver-${nextVersion}-${Date.now()}`,
    version_number: nextVersion,
    snapshot,
    published_by_discord_id: user.discordId,
    published_by_display_name: user.displayName,
    publish_note: publishNote || `Version ${nextVersion} published by ${user.displayName}`,
    changes_summary: summary,
    published_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from('rule_versions').insert({
        version_number: nextVersion,
        snapshot,
        published_by_discord_id: user.discordId,
        published_by_display_name: user.displayName,
        publish_note: versionRecord.publish_note,
        changes_summary: summary,
        published_at: versionRecord.published_at,
      });

      // Clear drafts
      await supabase.from('rules_draft').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('[SupabaseRules] Error writing published version to DB:', err);
    }
  }

  memVersions.push(versionRecord);
  memDrafts.clear();

  // Audit event
  await recordAuditEvent({
    discordUserId: user.discordId,
    displayName: user.displayName,
    action: 'rules.published',
    target: `Version ${nextVersion}`,
    details: `${summary.length} rule changes published live. Note: "${publishNote}"`,
    afterData: { version: nextVersion, changes: summary },
  });

  return {
    success: true,
    versionNumber: nextVersion,
    summary,
  };
}

/**
 * Rollback to a previous version snapshot.
 * Creates a NEW version snapshot based on the restored version, preserving full history.
 */
export async function rollbackToVersion(
  targetVersionNumber: number,
  user: { discordId: string; displayName: string }
): Promise<{ success: boolean; newVersionNumber: number }> {
  const supabase = createAdminClient();
  let targetVersion: DbRuleVersion | null = null;
  let latestVersionNumber = memVersions.length;

  if (supabase) {
    try {
      const { data: ver } = await supabase
        .from('rule_versions')
        .select('*')
        .eq('version_number', targetVersionNumber)
        .maybeSingle();

      if (ver) {
        targetVersion = ver;
      }

      const { data: latest } = await supabase
        .from('rule_versions')
        .select('version_number')
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest) {
        latestVersionNumber = latest.version_number;
      }
    } catch {
      // ignore
    }
  }

  if (!targetVersion) {
    targetVersion = memVersions.find((v) => v.version_number === targetVersionNumber) || null;
  }

  if (!targetVersion || !targetVersion.snapshot) {
    throw new Error(`Version ${targetVersionNumber} could not be found.`);
  }

  const restoredRules = targetVersion.snapshot.rules;
  const restoredCategories = targetVersion.snapshot.categories;
  const newVersionNumber = latestVersionNumber + 1;

  // Restore live database tables
  if (supabase) {
    try {
      // Upsert restored categories
      for (const cat of restoredCategories) {
        await supabase.from('rule_categories').upsert(cat, { onConflict: 'id' });
      }
      // Upsert restored rules
      for (const r of restoredRules) {
        await supabase.from('rules').upsert(r, { onConflict: 'id' });
      }

      // Create new snapshot
      await supabase.from('rule_versions').insert({
        version_number: newVersionNumber,
        snapshot: targetVersion.snapshot,
        published_by_discord_id: user.discordId,
        published_by_display_name: user.displayName,
        publish_note: `Rollback restoration: Restored snapshot from Version ${targetVersionNumber}`,
        changes_summary: [{ action: 'rollback', sourceVersion: targetVersionNumber }],
        published_at: new Date().toISOString(),
      });

      // Clear any pending drafts to match clean restored snapshot
      await supabase.from('rules_draft').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('[SupabaseRules] Error executing DB rollback:', err);
    }
  }

  // Update memory state
  memCategories = [...restoredCategories];
  memRules = [...restoredRules];
  memDrafts.clear();
  memVersions.push({
    id: `ver-${newVersionNumber}-${Date.now()}`,
    version_number: newVersionNumber,
    snapshot: targetVersion.snapshot,
    published_by_discord_id: user.discordId,
    published_by_display_name: user.displayName,
    publish_note: `Rollback restoration: Restored snapshot from Version ${targetVersionNumber}`,
    changes_summary: [{ action: 'rollback', sourceVersion: targetVersionNumber }],
    published_at: new Date().toISOString(),
  });

  // Audit event
  await recordAuditEvent({
    discordUserId: user.discordId,
    displayName: user.displayName,
    action: 'rules.rollback',
    target: `Version ${newVersionNumber}`,
    details: `Restored ruleset to Version ${targetVersionNumber}. New Version ${newVersionNumber} created.`,
  });

  return { success: true, newVersionNumber };
}

/**
 * Get all published version history entries.
 */
export async function getVersionHistory(): Promise<DbRuleVersion[]> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rule_versions')
        .select('*')
        .order('version_number', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[SupabaseRules] Error fetching versions from DB:', err);
    }
  }

  return [...memVersions].sort((a, b) => b.version_number - a.version_number);
}

/**
 * Get change history for a single rule.
 */
export async function getRuleChangeHistory(ruleId: string) {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rule_change_history')
        .select('*')
        .eq('rule_id', ruleId)
        .order('changed_at', { ascending: false });

      if (!error && data) return data;
    } catch {
      // ignore
    }
  }

  return memHistory.filter((h) => h.rule_id === ruleId);
}

async function recordRuleChangeHistory(entry: {
  rule_id: string;
  action: string;
  before_data?: any;
  after_data?: any;
  changed_by_discord_id: string;
  changed_by_display_name: string;
}) {
  const supabase = createAdminClient();
  const record = {
    ...entry,
    changed_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from('rule_change_history').insert(record);
    } catch {
      // ignore
    }
  }

  memHistory.unshift(record);
}

/**
 * Category management helpers.
 */
export async function createCategory(
  data: { id: string; title: string; description?: string; icon?: string },
  user: { discordId: string; displayName: string }
): Promise<DbRuleCategory> {
  const category: DbRuleCategory = {
    id: data.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
    title: data.title,
    description: data.description || '',
    icon: data.icon || 'ShieldAlert',
    sort_order: memCategories.length + 1,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from('rule_categories').insert(category);
    } catch (err) {
      console.warn('[SupabaseRules] Error creating category in DB:', err);
    }
  }

  memCategories.push(category);

  await recordAuditEvent({
    discordUserId: user.discordId,
    displayName: user.displayName,
    action: 'category.created',
    target: category.title,
    details: `Created rule category "${category.title}" (${category.id})`,
  });

  return category;
}

export async function updateCategory(
  id: string,
  data: Partial<DbRuleCategory>,
  user: { discordId: string; displayName: string }
): Promise<DbRuleCategory | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from('rule_categories').update(data).eq('id', id);
    } catch {
      // ignore
    }
  }

  const idx = memCategories.findIndex((c) => c.id === id);
  if (idx >= 0) {
    memCategories[idx] = { ...memCategories[idx], ...data, updated_at: new Date().toISOString() };
    await recordAuditEvent({
      discordUserId: user.discordId,
      displayName: user.displayName,
      action: 'category.updated',
      target: id,
      details: `Updated category "${id}"`,
      afterData: data,
    });
    return memCategories[idx];
  }

  return null;
}

export async function deleteCategory(
  id: string,
  user: { discordId: string; displayName: string }
): Promise<{ success: boolean; message?: string }> {
  // Check if rules exist in category
  const activeRules = memRules.filter((r) => r.category_id === id && !r.deleted_at);
  if (activeRules.length > 0) {
    return {
      success: false,
      message: `Cannot delete category "${id}" because it contains ${activeRules.length} active rules. Move or delete them first.`,
    };
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from('rule_categories').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  memCategories = memCategories.filter((c) => c.id !== id);

  await recordAuditEvent({
    discordUserId: user.discordId,
    displayName: user.displayName,
    action: 'category.deleted',
    target: id,
    details: `Deleted rule category "${id}"`,
  });

  return { success: true };
}
