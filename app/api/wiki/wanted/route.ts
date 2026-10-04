export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { listWikiEntities } from '@/lib/wiki/graph-store';
import { isPublicPage, normalizeWikiName } from '@/lib/wiki/link-core';
import { wikiOptions, wikiResponse } from '@/lib/wiki/api';
import { WikiLink } from '@/lib/wiki/types';
export const OPTIONS = wikiOptions;
export async function GET(request: NextRequest) {
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  const [snap, pages] = await Promise.all([adminDb.collection('wiki_links').where('status', '==', 'unresolved').get(), listWikiEntities(adminDb)]);
  const byId = new Map(pages.filter(isPublicPage).map(p => [p.id, p]));
  const q = normalizeWikiName(request.nextUrl.searchParams.get('q') || '');
  const groups = new Map<string, any>();
  for (const doc of snap.docs) {
    const l = doc.data() as WikiLink;
    const source = byId.get(l.source_page_id);
    if (!source || l.section_hidden || !l.source_public || (q && !l.normalized_name.includes(q))) continue;
    const key = JSON.stringify([l.normalized_name, l.expected_entity_type]);
    const group = groups.get(key) || { name: l.original_mention_text.replace(/^@/, ''), normalized_name: l.normalized_name, expected_entity_type: l.expected_entity_type, references: [] };
    group.references.push({ id: l.id, section: l.section_title, section_key:l.section_key, context_snippet: l.context_snippet, source: { id: source.id, slug: source.slug, title: source.title, entity_type: source.entity_type } });
    groups.set(key, group);
  }
  return wikiResponse(request, { wanted: [...groups.values()].map(g => ({ ...g, page_count: new Set(g.references.map(r => r.source.id)).size })).sort((a,b) => b.page_count - a.page_count || a.name.localeCompare(b.name)) });
}
