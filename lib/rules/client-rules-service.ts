import { supabase } from '@/lib/supabase/client';
import { RULE_CATEGORIES, RULES, RuleCallout } from '@/data/rules';
import { DbRule, DbRuleCategory, DbRuleDraft, StagedChangeSummary, DbRuleVersion } from './supabase-rules';

/**
 * Helper to safely call an API route. If it returns HTML (e.g. on static GitHub Pages hosting vitalrp.net)
 * or non-200, returns null instead of throwing JSON parse error.
 */
async function safeApiCall<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
  } catch {
    // API unreachable or client-only
  }
  return null;
}

export interface RulesHeroConfig {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  pillars?: string[];
  updatedDateOverride?: string;
}

export interface ClientRulesData {
  categories: DbRuleCategory[];
  rules: DbRule[];
  draftsCount: number;
  publishedCount: number;
  currentVersion: number;
  lastPublishedAt?: string;
  lastPublishedBy?: string;
  heroConfig?: RulesHeroConfig;
}

/**
 * Fetch all categories, rules, and drafts.
 * Works seamlessly in both Next.js server environment and static SPA on vitalrp.net.
 */
export async function getClientRulesData(): Promise<ClientRulesData> {
  // 1. Try server API route first
  const apiData = await safeApiCall<ClientRulesData>('/api/admin/rules');
  if (apiData && Array.isArray(apiData.rules) && apiData.rules.length > 0) {
    return apiData;
  }

  // 2. Direct Supabase Client Query (Runs on vitalrp.net static SPA)
  try {
    const [catsRes, rulesRes, draftsRes, verRes] = await Promise.all([
      supabase.from('rule_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('rules').select('*').order('sort_order', { ascending: true }),
      supabase.from('rules_draft').select('*').order('updated_at', { ascending: false }),
      supabase.from('rule_versions').select('*').order('version_number', { ascending: false }).limit(1).maybeSingle(),
    ]);

    let allRawCategories: any[] = catsRes.data || [];
    let heroConfig: RulesHeroConfig | undefined;
    const heroRow = allRawCategories.find((c) => c.id === '__hero_config__');
    if (heroRow && heroRow.description) {
      try {
        heroConfig = JSON.parse(heroRow.description);
      } catch {}
    }
    let categories: DbRuleCategory[] = allRawCategories.filter((c) => !c.id.startsWith('__'));
    let rules: DbRule[] = rulesRes.data || [];
    const drafts: DbRuleDraft[] = draftsRes.data || [];
    const currentVersion = verRes.data?.version_number || 1;
    const lastPublishedAt = verRes.data?.published_at;
    const lastPublishedBy = verRes.data?.published_by_display_name;

    // Fallback to existing 31 website rules & 9 categories if Supabase is empty or not yet seeded
    if (categories.length === 0) {
      categories = RULE_CATEGORIES.map((c, idx) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        icon: c.iconName,
        sort_order: idx + 1,
        enabled: true,
      }));
    }

    if (rules.length === 0) {
      rules = RULES.map((r, idx) => ({
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
      }));
    }

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

    // Append new rule drafts
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

    // Ensure all rules are sorted by sort_order (so draft positions are immediately visible)
    mergedRules.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return {
      categories,
      rules: mergedRules,
      draftsCount: drafts.length,
      publishedCount: rules.filter((r) => !r.deleted_at && r.enabled).length,
      currentVersion,
      lastPublishedAt,
      lastPublishedBy,
      heroConfig,
    };
  } catch (err) {
    console.warn('[ClientRules] Error querying Supabase, using initial website dataset:', err);
    return {
      categories: RULE_CATEGORIES.map((c, idx) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        icon: c.iconName,
        sort_order: idx + 1,
        enabled: true,
      })),
      rules: RULES.map((r, idx) => ({
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
      })),
      draftsCount: 0,
      publishedCount: 31,
      currentVersion: 1,
      lastPublishedAt: new Date().toISOString(),
      lastPublishedBy: 'Damon',
    };
  }
}

/**
 * Synchronize and import all 31 existing rules and 9 categories into Supabase.
 * Works seamlessly from vitalrp.net client.
 */
export async function syncExistingRulesToSupabase(
  user: { discordId: string; displayName: string },
  force = false,
  currentCategories?: DbRuleCategory[],
  currentRules?: DbRule[]
): Promise<{ success: boolean; message: string }> {
  // 1. Try server endpoint first (with payload if provided)
  const apiRes = await safeApiCall<{ success: boolean; message: string }>(
    `/api/admin/rules/seed${force ? '?force=true' : ''}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: currentCategories, rules: currentRules }),
    }
  );
  if (apiRes) return apiRes;

  // 2. Direct client-side Supabase Upsert
  // Test if table exists
  const { data: testCats, error: testErr } = await supabase.from('rule_categories').select('id').limit(1);
  if (testErr) {
    if (testErr.message.includes('schema cache') || testErr.message.includes('does not exist')) {
      throw new Error(
        'Supabase tables have not been created yet. Please execute "supabase_schema.sql" in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/pbzwxfiytgwqmifpmzkb/sql).'
      );
    }
    throw new Error(testErr.message);
  }

  // Use provided categories or default website categories
  const categoriesToUpsert =
    currentCategories && currentCategories.length > 0
      ? currentCategories
      : RULE_CATEGORIES.map((c, idx) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          icon: c.iconName,
          sort_order: idx + 1,
          enabled: true,
        }));

  // Upsert categories
  const catRows = categoriesToUpsert.map((c, idx) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    icon: c.icon || (c as any).iconName || 'ShieldAlert',
    sort_order: c.sort_order ?? idx + 1,
    enabled: c.enabled ?? true,
    updated_at: new Date().toISOString(),
  }));
  const { error: catErr } = await supabase.from('rule_categories').upsert(catRows, { onConflict: 'id' });
  if (catErr) throw new Error(`Category import error: ${catErr.message}`);

  // Use provided rules or default website rules
  const rulesToUpsert =
    currentRules && currentRules.length > 0
      ? currentRules
      : RULES.map((r, idx) => ({
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
        }));

  const ruleRows = rulesToUpsert.map((r, idx) => ({
    id: r.id,
    category_id: r.category_id || (r as any).category,
    rule_number: r.rule_number ?? idx + 1,
    title: r.title,
    short_title: r.short_title || (r as any).shortTitle || r.title,
    short_description: r.short_description || (r as any).summary || '',
    content: r.content,
    aliases: r.aliases || [],
    featured: Boolean(r.featured),
    core_rule_number: r.core_rule_number || (r as any).coreRuleNumber || null,
    severity: r.severity || 'standard',
    callouts: r.callouts || [],
    sort_order: r.sort_order ?? idx + 1,
    enabled: r.enabled ?? true,
    updated_at: new Date().toISOString(),
  }));
  const { error: ruleErr } = await supabase.from('rules').upsert(ruleRows, { onConflict: 'id' });
  if (ruleErr) throw new Error(`Rules import error: ${ruleErr.message}`);

  // Insert Version 1 snapshot if not present
  const { data: existingVer } = await supabase.from('rule_versions').select('id').eq('version_number', 1).maybeSingle();
  if (!existingVer) {
    await supabase.from('rule_versions').insert({
      version_number: 1,
      snapshot: {
        categories: catRows,
        rules: ruleRows,
      },
      published_by_discord_id: user.discordId,
      published_by_display_name: user.displayName,
      publish_note: 'Initial Rules CMS migration from public website.',
      changes_summary: [{ type: 'initial_migration', count: ruleRows.length }],
      published_at: new Date().toISOString(),
    });
  }

  return {
    success: true,
    message: 'Successfully imported all 31 rules and 9 categories into Supabase (Version 1).',
  };
}

/**
 * Save or update a draft rule.
 */
export async function saveClientRuleDraft(
  draftData: Partial<DbRuleDraft> & { rule_id: string; title: string; content: string; category_id: string },
  user: { discordId: string; displayName: string }
): Promise<{ success: boolean }> {
  // 1. Try API first
  const apiRes = await safeApiCall<{ success: boolean }>('/api/admin/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draftData),
  });
  if (apiRes) return apiRes;

  // 2. Direct Supabase write (handles existing draft without requiring DB unique constraint)
  const row = {
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
    sort_order: draftData.sort_order || 0,
    enabled: draftData.enabled ?? true,
    action: draftData.action || 'update',
    created_by_discord_id: user.discordId,
    created_by_name: user.displayName,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: selectErr } = await supabase
    .from('rules_draft')
    .select('id')
    .eq('rule_id', draftData.rule_id)
    .maybeSingle();

  if (selectErr) {
    console.warn('[client-rules] Error checking existing draft:', selectErr);
  }

  if (existing?.id) {
    const { error: updateErr } = await supabase
      .from('rules_draft')
      .update(row)
      .eq('id', existing.id);
    if (updateErr) throw new Error(updateErr.message);
  } else {
    const { error: insertErr } = await supabase
      .from('rules_draft')
      .insert(row);
    if (insertErr) throw new Error(insertErr.message);
  }

  return { success: true };
}

/**
 * Discard a staged draft.
 */
export async function discardClientRuleDraft(ruleId: string): Promise<boolean> {
  const apiRes = await safeApiCall<{ success: boolean }>(`/api/admin/rules?ruleId=${ruleId}&discard=true`, {
    method: 'DELETE',
  });
  if (apiRes) return true;

  const { error } = await supabase.from('rules_draft').delete().eq('rule_id', ruleId);
  return !error;
}

/**
 * Discard all staged draft changes at once (reverts to live published state).
 */
export async function discardAllClientRuleDrafts(): Promise<boolean> {
  const apiRes = await safeApiCall<{ success: boolean }>('/api/admin/rules?all=true&discard=true', {
    method: 'DELETE',
  });
  if (apiRes) return true;

  const { error } = await supabase
    .from('rules_draft')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  return !error;
}

/**
 * Stage a rule deletion.
 */
export async function deleteClientRule(
  ruleId: string,
  user: { discordId: string; displayName: string }
): Promise<boolean> {
  const apiRes = await safeApiCall<{ success: boolean }>(`/api/admin/rules?ruleId=${ruleId}`, {
    method: 'DELETE',
  });
  if (apiRes) return true;

  const row = {
    rule_id: ruleId,
    category_id: 'general',
    title: `Deleted rule ${ruleId}`,
    content: '',
    action: 'delete',
    created_by_discord_id: user.discordId,
    created_by_name: user.displayName,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('rules_draft')
    .select('id')
    .eq('rule_id', ruleId)
    .maybeSingle();

  if (existing?.id) {
    const { error: updateErr } = await supabase
      .from('rules_draft')
      .update(row)
      .eq('id', existing.id);
    return !updateErr;
  } else {
    const { error: insertErr } = await supabase
      .from('rules_draft')
      .insert(row);
    return !insertErr;
  }
}

/**
 * Get staged changes diff summary for publish modal.
 */
export async function getClientStagedChanges(): Promise<StagedChangeSummary[]> {
  const apiRes = await safeApiCall<{ summary: StagedChangeSummary[] }>('/api/admin/rules/publish');
  if (apiRes && Array.isArray(apiRes.summary)) return apiRes.summary;

  const [draftsRes, rulesRes] = await Promise.all([
    supabase.from('rules_draft').select('*'),
    supabase.from('rules').select('*'),
  ]);

  const drafts: DbRuleDraft[] = draftsRes.data || [];
  const rules: DbRule[] = rulesRes.data || [];
  const ruleMap = new Map(rules.map((r) => [r.id, r]));

  return drafts.map((d) => {
    const existing = ruleMap.get(d.rule_id);
    return {
      rule_id: d.rule_id,
      title: d.title,
      category_id: d.category_id,
      action: d.action,
      before: existing
        ? {
            title: existing.title,
            rule_number: existing.rule_number,
            content: existing.content,
            category_id: existing.category_id,
            enabled: existing.enabled,
            sort_order: existing.sort_order,
          }
        : null,
      after: {
        title: d.title,
        rule_number: d.rule_number,
        content: d.content,
        category_id: d.category_id,
        enabled: d.enabled,
        sort_order: d.sort_order,
      },
    };
  });
}

/**
 * Publish staged draft changes to live rules.
 */
export async function publishClientStagedChanges(
  publishNote: string,
  user: { discordId: string; displayName: string }
): Promise<{ success: boolean; versionNumber: number }> {
  const apiRes = await safeApiCall<{ success: boolean; versionNumber: number }>('/api/admin/rules/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publishNote }),
  });
  if (apiRes) return apiRes;

  const { data: drafts } = await supabase.from('rules_draft').select('*');
  if (!drafts || drafts.length === 0) {
    throw new Error('No staged draft changes found to publish.');
  }

  for (const draft of drafts) {
    if (draft.action === 'delete') {
      await supabase
        .from('rules')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.displayName,
        })
        .eq('id', draft.rule_id);
    } else {
      const payload = {
        id: draft.rule_id,
        category_id: draft.category_id,
        rule_number: draft.rule_number,
        title: draft.title,
        short_title: draft.short_title,
        short_description: draft.short_description,
        content: draft.content,
        aliases: draft.aliases || [],
        featured: draft.featured,
        core_rule_number: draft.core_rule_number,
        severity: draft.severity,
        callouts: draft.callouts || [],
        sort_order: draft.sort_order,
        enabled: draft.enabled,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('rules').upsert(payload, { onConflict: 'id' });
    }
    await supabase.from('rules_draft').delete().eq('id', draft.id);
  }

  const [catsRes, rulesRes, verRes] = await Promise.all([
    supabase.from('rule_categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('rules').select('*').is('deleted_at', null).order('sort_order', { ascending: true }),
    supabase.from('rule_versions').select('version_number').order('version_number', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const nextVer = (verRes.data?.version_number || 1) + 1;
  await supabase.from('rule_versions').insert({
    version_number: nextVer,
    snapshot: {
      categories: catsRes.data || [],
      rules: rulesRes.data || [],
    },
    published_by_discord_id: user.discordId,
    published_by_display_name: user.displayName,
    publish_note: publishNote || 'Published via Rules CMS',
    changes_summary: drafts.map((d) => ({ rule_id: d.rule_id, action: d.action })),
    published_at: new Date().toISOString(),
  });

  return { success: true, versionNumber: nextVer };
}

/**
 * Get version history list.
 */
export async function getClientVersions(): Promise<DbRuleVersion[]> {
  const apiRes = await safeApiCall<{ versions: DbRuleVersion[] }>('/api/admin/rules/versions');
  if (apiRes && Array.isArray(apiRes.versions)) return apiRes.versions;

  const { data } = await supabase
    .from('rule_versions')
    .select('*')
    .order('version_number', { ascending: false });
  return data || [];
}

/**
 * Rollback to target version.
 */
export async function rollbackClientToVersion(
  targetVersionNumber: number,
  user: { discordId: string; displayName: string }
): Promise<{ success: boolean; newVersionNumber: number }> {
  const apiRes = await safeApiCall<{ success: boolean; newVersionNumber: number }>('/api/admin/rules/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionNumber: targetVersionNumber }),
  });
  if (apiRes) return apiRes;

  const { data: ver } = await supabase
    .from('rule_versions')
    .select('*')
    .eq('version_number', targetVersionNumber)
    .single();

  if (!ver || !ver.snapshot) {
    throw new Error(`Version ${targetVersionNumber} could not be loaded.`);
  }

  const restoredRules = ver.snapshot.rules;
  for (const r of restoredRules) {
    await supabase.from('rules').upsert(r, { onConflict: 'id' });
  }

  const { data: latest } = await supabase
    .from('rule_versions')
    .select('version_number')
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const newVerNumber = (latest?.version_number || 1) + 1;
  await supabase.from('rule_versions').insert({
    version_number: newVerNumber,
    snapshot: ver.snapshot,
    published_by_discord_id: user.discordId,
    published_by_display_name: user.displayName,
    publish_note: `Rollback to Version ${targetVersionNumber}`,
    changes_summary: [{ type: 'rollback', targetVersion: targetVersionNumber }],
    published_at: new Date().toISOString(),
  });

  return { success: true, newVersionNumber: newVerNumber };
}

/**
 * Save category (create or update).
 */
export async function saveClientCategory(categoryData: {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order?: number;
  enabled?: boolean;
}): Promise<boolean> {
  const isUpdate = Boolean(categoryData.id);
  const method = isUpdate ? 'PUT' : 'POST';
  const apiRes = await safeApiCall<{ success: boolean }>('/api/admin/rules/categories', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData),
  });
  if (apiRes) return true;

  const id = categoryData.id || categoryData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const { error } = await supabase.from('rule_categories').upsert(
    {
      id,
      title: categoryData.title,
      description: categoryData.description,
      icon: categoryData.icon || 'ShieldAlert',
      sort_order: categoryData.sort_order || 99,
      enabled: categoryData.enabled ?? true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  return !error;
}

/**
 * Delete category by ID.
 */
export async function deleteClientCategory(categoryId: string): Promise<{ success: boolean; message?: string }> {
  const apiRes = await safeApiCall<{ success: boolean; error?: string }>(`/api/admin/rules/categories?id=${encodeURIComponent(categoryId)}`, {
    method: 'DELETE',
  });
  if (apiRes) return { success: apiRes.success, message: apiRes.error };

  const { error } = await supabase.from('rule_categories').delete().eq('id', categoryId);
  return { success: !error, message: error?.message };
}

/**
 * Fetch Rules Hero customization configuration.
 */
export async function getRulesHeroConfig(): Promise<RulesHeroConfig> {
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('vital_rules_hero_config');
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
    }
    const { data } = await supabase
      .from('rule_categories')
      .select('description')
      .eq('id', '__hero_config__')
      .maybeSingle();

    if (data && data.description) {
      const parsed = JSON.parse(data.description);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vital_rules_hero_config', JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {}
  return {
    eyebrow: 'VITAL ROLEPLAY CONSTITUTION',
    title: 'SERVER RULES',
    subtitle: 'Serious roleplay works when everyone understands the expectations.',
    description: 'Vital RP is built on player-driven storytelling, deep immersion, common sense, and putting roleplay over ruleplay. Familiarize yourself with our server legislation to keep Los Santos authentic and engaging for everyone.',
    pillars: [
      'Storytelling First',
      'Quality RP',
      'Deep Immersion',
      'Common Sense Expected',
      'Roleplay Over Ruleplay',
    ],
    updatedDateOverride: '',
  };
}

/**
 * Save Rules Hero customization configuration.
 */
export async function saveRulesHeroConfig(config: RulesHeroConfig): Promise<boolean> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vital_rules_hero_config', JSON.stringify(config));
  }
  try {
    const { error } = await supabase.from('rule_categories').upsert(
      {
        id: '__hero_config__',
        title: 'Hero Configuration',
        description: JSON.stringify(config),
        icon: 'LayoutTemplate',
        sort_order: 9999,
        enabled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}
