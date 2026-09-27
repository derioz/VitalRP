const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260927_vital_admin_rules_system.sql');
const seedPath = path.join(__dirname, '..', 'supabase', 'seed_rules.sql');

const seedContent = fs.readFileSync(seedPath, 'utf8');

// Update supabase_schema.sql
let schemaContent = fs.readFileSync(schemaPath, 'utf8');
if (!schemaContent.includes('12. INITIAL SEED: ACTUAL VITAL RP RULES & CATEGORIES MIGRATION')) {
  schemaContent = schemaContent.trimEnd() + '\n\n' + seedContent.trim() + '\n';
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('Appended seed to supabase_schema.sql');
} else {
  console.log('supabase_schema.sql already has seed');
}

// Update migration
let migContent = fs.readFileSync(migrationPath, 'utf8');
if (!migContent.includes('12. INITIAL SEED: ACTUAL VITAL RP RULES & CATEGORIES MIGRATION')) {
  migContent = migContent.trimEnd() + '\n\n' + seedContent.trim() + '\n';
  fs.writeFileSync(migrationPath, migContent, 'utf8');
  console.log('Appended seed to 20260927_vital_admin_rules_system.sql');
} else {
  console.log('20260927_vital_admin_rules_system.sql already has seed');
}
