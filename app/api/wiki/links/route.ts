export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { commitWikiPage, getWikiEntity, listWikiEntities } from '@/lib/wiki/graph-store';
import { exactCandidates, isPublicPage } from '@/lib/wiki/link-core';
import { canEditWikiPage, isWikiModerator } from '@/lib/wiki/permissions';
import { wikiOptions, wikiResponse, wikiSession } from '@/lib/wiki/api';
import { WikiLink } from '@/lib/wiki/types';
export const OPTIONS = wikiOptions;
export async function GET(request: NextRequest) {
  const session = await wikiSession(request);
  if (!session) return wikiResponse(request, { error: 'Sign in to manage Wiki links.' }, 401);
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  const sourceId = request.nextUrl.searchParams.get('source');
  const source = sourceId ? await getWikiEntity(adminDb, sourceId) : null;
  if (sourceId ? !source || !canEditWikiPage(session, source) : !isWikiModerator(session)) return wikiResponse(request, { error: 'You cannot manage these Wiki links.' }, 403);
  const pages = await listWikiEntities(adminDb);
  const query = sourceId ? adminDb.collection('wiki_links').where('source_page_id', '==', sourceId) : adminDb.collection('wiki_links');
  const snap = await query.get();
  const metadata = (p: typeof source) => p ? { id:p.id, slug:p.slug, title:p.title, entity_type:p.entity_type } : null;
  const links = snap.docs.map(d => d.data() as WikiLink).map(l => ({ ...l, source: metadata(pages.find(p => p.id === l.source_page_id) || null), target: metadata(pages.find(p => p.id === l.target_page_id && isPublicPage(p)) || null), potential_matches: exactCandidates(l, pages).map(p => ({ id: p.id, slug: p.slug, title: p.title, full_name: p.title, entity_type: p.entity_type })) }));
  const audit = await adminDb.collection('wiki_link_audit').orderBy('resolved_at', 'desc').limit(200).get();
  return wikiResponse(request, { links, audit: audit.docs.map(d => ({ id: d.id, ...d.data() })).filter((a: any) => !sourceId || a.source_page_id === sourceId) });
}
export async function POST(request: NextRequest) {
  const session = await wikiSession(request);
  if (!isWikiModerator(session)) return wikiResponse(request, { error: 'Wiki moderator access is required.' }, 403);
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  // Explicit, idempotent import; never scan rendered text to build backlinks on reads.
  const pages = await listWikiEntities(adminDb);
  let imported = 0;
  for (const page of pages) { await commitWikiPage(adminDb, page, session!.id || session!.discordId || null, { importOnly: true }); imported++; }
  return wikiResponse(request, { imported });
}
