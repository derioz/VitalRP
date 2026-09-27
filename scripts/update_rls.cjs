const fs = require('fs');
const path = require('path');

const rlsAdditions = `

DROP POLICY IF EXISTS "Allow manage rule categories" ON public.rule_categories;
CREATE POLICY "Allow manage rule categories"
  ON public.rule_categories FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage rules" ON public.rules;
CREATE POLICY "Allow manage rules"
  ON public.rules FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage rules draft" ON public.rules_draft;
CREATE POLICY "Allow manage rules draft"
  ON public.rules_draft FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage rule versions" ON public.rule_versions;
CREATE POLICY "Allow manage rule versions"
  ON public.rule_versions FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage rule change history" ON public.rule_change_history;
CREATE POLICY "Allow manage rule change history"
  ON public.rule_change_history FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage audit logs" ON public.audit_logs;
CREATE POLICY "Allow manage audit logs"
  ON public.audit_logs FOR ALL
  USING (true)
  WITH CHECK (true);
`;

const files = [
  path.join(__dirname, '..', 'supabase_schema.sql'),
  path.join(__dirname, '..', 'supabase', 'migrations', '20260927_vital_admin_rules_system.sql'),
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('Allow manage rules draft')) {
    const target = 'ON public.rule_versions FOR SELECT\n  USING (true);';
    const targetCRLF = 'ON public.rule_versions FOR SELECT\r\n  USING (true);';
    if (content.includes(targetCRLF)) {
      content = content.replace(targetCRLF, targetCRLF + rlsAdditions.replace(/\n/g, '\r\n'));
      fs.writeFileSync(f, content, 'utf8');
      console.log(`Updated ${path.basename(f)}`);
    } else if (content.includes(target)) {
      content = content.replace(target, target + rlsAdditions);
      fs.writeFileSync(f, content, 'utf8');
      console.log(`Updated ${path.basename(f)}`);
    } else {
      console.log(`Target not matched in ${path.basename(f)}`);
    }
  } else {
    console.log(`Already has RLS in ${path.basename(f)}`);
  }
}
