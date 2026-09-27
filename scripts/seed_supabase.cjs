const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Extract existing rules and categories from data/rules.ts
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

// Load .env.local if present without hardcoding secrets
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      const keyName = k.trim();
      const val = v.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[keyName]) {
        process.env[keyName] = val;
      }
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pbzwxfiytgwqmifpmzkb.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error('[Error] SUPABASE_SERVICE_ROLE_KEY environment variable is required to run the seed script.');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSeed() {
  console.log('--- Vital RP Rules CMS Supabase Seed ---');
  console.log(`Target Supabase URL: ${url}`);
  console.log(`Categories to import: ${categories.length}`);
  console.log(`Rules to import: ${rules.length}`);

  // Test if table exists
  const { error: testErr } = await supabase.from('rule_categories').select('id').limit(1);
  if (testErr) {
    console.error('\n[Notice] Tables not yet detected in Supabase schema cache:', testErr.message);
    console.log('To initialize tables in Supabase:');
    console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/pbzwxfiytgwqmifpmzkb');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Paste and run "supabase_schema.sql"');
    return;
  }

  console.log('\n[1/3] Upserting Rule Categories...');
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const { error } = await supabase.from('rule_categories').upsert({
      id: c.id,
      title: c.title,
      description: c.description,
      icon: c.iconName,
      sort_order: i + 1,
      enabled: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) console.error(`Failed category ${c.id}:`, error.message);
    else console.log(`✓ Category [${c.id}] ${c.title}`);
  }

  console.log('\n[2/3] Upserting Existing Website Rules...');
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    const { error } = await supabase.from('rules').upsert({
      id: r.id,
      category_id: r.category,
      rule_number: i + 1,
      title: r.title,
      short_title: r.shortTitle || r.title,
      short_description: r.summary || '',
      content: r.content,
      aliases: r.aliases || [],
      featured: Boolean(r.featured),
      core_rule_number: r.coreRuleNumber || null,
      severity: 'standard',
      callouts: r.callouts || [],
      sort_order: i + 1,
      enabled: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) console.error(`Failed rule ${r.id}:`, error.message);
    else console.log(`✓ Rule #${i + 1} [${r.id}] ${r.title}`);
  }

  console.log('\n[3/3] Creating Initial Version 1 Snapshot...');
  const snapshot = {
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

  const { error: verErr } = await supabase.from('rule_versions').upsert({
    version_number: 1,
    snapshot,
    published_by_discord_id: '150580708144840704',
    published_by_display_name: 'Damon',
    publish_note: 'Initial Rules CMS migration: Official server constitution and ruleset snapshot (31 rules across 9 categories).',
    changes_summary: [{ action: 'migration', rulesCount: rules.length, categoriesCount: categories.length }],
    published_at: new Date().toISOString()
  }, { onConflict: 'version_number' });

  if (verErr) console.error('Failed version snapshot:', verErr.message);
  else console.log('✓ Published Version 1 Snapshot successfully created!');

  console.log('\nSeed process complete.');
}

runSeed().catch(console.error);
