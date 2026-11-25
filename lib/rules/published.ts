import { supabase } from '@/lib/supabase/client';
import { getApiUrl } from '@/lib/api-config';
import type { Rule } from '@/data/rules';

export interface PublishedRule extends Rule {
  /** The number the rule carries on /rules. */
  number: number;
  categoryTitle?: string;
}

const TIMEOUT_MS = 5000;

function toRules(rawRules: any[], rawCategories: any[]): PublishedRule[] {
  const titles = new Map<string, string>(rawCategories.map((c) => [c.id, c.title]));
  return rawRules
    .filter((r) => r.enabled !== false && !r.deleted_at)
    .map((r) => ({
      id: r.id,
      number: r.rule_number,
      category: r.category_id,
      categoryTitle: titles.get(r.category_id),
      title: r.title,
      shortTitle: r.short_title || r.title,
      summary: r.short_description || r.summary || '',
      content: r.content,
      aliases: r.aliases || [],
      featured: Boolean(r.featured),
      callouts: r.callouts || [],
    }));
}

/**
 * The rules as currently published, from the same tables /rules reads. There is
 * deliberately no built-in copy to fall back on: an out-of-date penalty is worse
 * than asking the reader to open the rulebook.
 */
export async function loadPublishedRules(): Promise<PublishedRule[]> {
  try {
    // Without a deadline a dead connection retries for a long time
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    const [categories, rules] = await Promise.all([
      supabase.from('rule_categories').select('*').abortSignal(signal),
      supabase.from('rules').select('*').is('deleted_at', null).eq('enabled', true).abortSignal(signal),
    ]);
    if (!rules.error && rules.data?.length) return toRules(rules.data, categories.data || []);
  } catch {
    // Fall through to the website API
  }

  const res = await fetch(getApiUrl('/api/rules'), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Rules request failed: ${res.status}`);
  const data = await res.json();
  if (!data?.rules?.length) throw new Error('Rules response was empty');
  return toRules(data.rules, data.categories || []);
}
