const fs = require('fs');
const path = require('path');

// Read data/rules.ts
const content = fs.readFileSync(path.join(__dirname, '..', 'data', 'rules.ts'), 'utf8');

const cleaned = content
  .replace(/export interface[\s\S]*?}\n\n/g, '')
  .replace(/export const RULE_CATEGORIES: RuleCategory\[\] =/, 'const RULE_CATEGORIES =')
  .replace(/export const RULES: Rule\[\] =/, 'const RULES =')
  .replace(/export /g, '');

const sandbox = {};
const fn = new Function('sandbox', cleaned + '\nsandbox.RULE_CATEGORIES = RULE_CATEGORIES;\nsandbox.RULES = RULES;');
fn(sandbox);

const categories = sandbox.RULE_CATEGORIES;
const rules = sandbox.RULES;

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

let sql = `
-- =========================================================================
-- 12. INITIAL SEED: ACTUAL VITAL RP RULES & CATEGORIES MIGRATION (VERSION 1)
-- =========================================================================

-- Seed Rule Categories
INSERT INTO public.rule_categories (id, title, description, icon, sort_order, enabled)
VALUES
`;

const catValues = categories.map((c, i) => {
  return `  (${escapeSql(c.id)}, ${escapeSql(c.title)}, ${escapeSql(c.description)}, ${escapeSql(c.iconName)}, ${i + 1}, true)`;
});

sql += catValues.join(',\n');
sql += `\nON CONFLICT (id) DO UPDATE SET\n  title = EXCLUDED.title,\n  description = EXCLUDED.description,\n  icon = EXCLUDED.icon,\n  sort_order = EXCLUDED.sort_order,\n  enabled = EXCLUDED.enabled;\n\n`;

sql += `-- Seed All 31 Existing Website Rules\nINSERT INTO public.rules (id, category_id, rule_number, title, short_title, short_description, content, aliases, featured, core_rule_number, severity, callouts, sort_order, enabled)\nVALUES\n`;

const ruleValues = rules.map((r, i) => {
  const aliasesArray = "ARRAY[" + (r.aliases || []).map(a => escapeSql(a)).join(', ') + "]::TEXT[]";
  const calloutsJson = escapeSql(JSON.stringify(r.callouts || [])) + "::jsonb";
  return `  (${escapeSql(r.id)}, ${escapeSql(r.category)}, ${i + 1}, ${escapeSql(r.title)}, ${escapeSql(r.shortTitle || r.title)}, ${escapeSql(r.summary || '')}, ${escapeSql(r.content)}, ${aliasesArray}, ${r.featured ? 'true' : 'false'}, ${r.coreRuleNumber ? r.coreRuleNumber : 'NULL'}, 'standard', ${calloutsJson}, ${i + 1}, true)`;
});

sql += ruleValues.join(',\n');
sql += `\nON CONFLICT (id) DO UPDATE SET\n  category_id = EXCLUDED.category_id,\n  rule_number = EXCLUDED.rule_number,\n  title = EXCLUDED.title,\n  short_title = EXCLUDED.short_title,\n  short_description = EXCLUDED.short_description,\n  content = EXCLUDED.content,\n  aliases = EXCLUDED.aliases,\n  featured = EXCLUDED.featured,\n  core_rule_number = EXCLUDED.core_rule_number,\n  callouts = EXCLUDED.callouts,\n  sort_order = EXCLUDED.sort_order,\n  enabled = EXCLUDED.enabled;\n\n`;

// Seed Version 1 Snapshot
const snapshotObj = {
  categories: categories.map((c, i) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    icon: c.iconName,
    sort_order: i + 1,
    enabled: true
  })),
  rules: rules.map((r, i) => ({
    id: r.id,
    category_id: r.category,
    rule_number: i + 1,
    title: r.title,
    short_title: r.shortTitle,
    short_description: r.summary,
    content: r.content,
    aliases: r.aliases || [],
    featured: Boolean(r.featured),
    core_rule_number: r.coreRuleNumber,
    severity: 'standard',
    callouts: r.callouts || [],
    sort_order: i + 1,
    enabled: true
  }))
};

sql += `-- Seed Published Initial Version 1 Snapshot\n`;
sql += `INSERT INTO public.rule_versions (version_number, snapshot, published_by_discord_id, published_by_display_name, publish_note, changes_summary, published_at)\nVALUES (\n  1,\n  ${escapeSql(JSON.stringify(snapshotObj))}::jsonb,\n  '150580708144840704',\n  'Damon',\n  'Initial Rules CMS migration: Official server constitution and ruleset snapshot (31 rules across 9 categories).',\n  '[{"action": "migration", "rulesCount": ${rules.length}, "categoriesCount": ${categories.length}}]'::jsonb,\n  now()\n)\nON CONFLICT (version_number) DO NOTHING;\n`;

fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seed_rules.sql'), sql);
console.log('Seed SQL generated successfully!');
