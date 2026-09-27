const fs = require('fs');
const path = require('path');

// We can compile or transpile data/rules.ts to JS or use ts-node or esbuild/tsx or simple regex/eval
const content = fs.readFileSync(path.join(__dirname, '..', 'data', 'rules.ts'), 'utf8');

// Strip TypeScript type annotations to evaluate
const cleaned = content
  .replace(/export interface[\s\S]*?}\n\n/g, '')
  .replace(/export const RULE_CATEGORIES: RuleCategory\[\] =/, 'const RULE_CATEGORIES =')
  .replace(/export const RULES: Rule\[\] =/, 'const RULES =')
  .replace(/export /g, '');

const sandbox = {};
const fn = new Function('sandbox', cleaned + '\nsandbox.RULE_CATEGORIES = RULE_CATEGORIES;\nsandbox.RULES = RULES;');
fn(sandbox);

console.log('Categories count:', sandbox.RULE_CATEGORIES.length);
console.log('Rules count:', sandbox.RULES.length);

console.log('\nCategories:');
sandbox.RULE_CATEGORIES.forEach((c, i) => {
  const catRules = sandbox.RULES.filter(r => r.category === c.id);
  console.log(`${i+1}. [${c.id}] "${c.title}" -> ${catRules.length} rules (Icon: ${c.iconName})`);
});

console.log('\nSample Rule 1:');
console.log(JSON.stringify(sandbox.RULES[0], null, 2));

console.log('\nCore Rules count (featured):', sandbox.RULES.filter(r => r.featured).length);
