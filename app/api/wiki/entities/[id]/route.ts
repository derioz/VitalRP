export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { commitWikiPage, getWikiEntity, getWikiLinks, getWikiBacklinks } from '@/lib/wiki/graph-store';
import { isPublicPage, mentionMarker } from '@/lib/wiki/link-core';
import { canEditWikiPage } from '@/lib/wiki/permissions';
import { wikiOptions, wikiResponse, wikiSession } from '@/lib/wiki/api';
export const OPTIONS = wikiOptions;
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  const { id } = await params;
  const page = await getWikiEntity(adminDb, id);
  const session = await wikiSession(request);
  if (!page || (!isPublicPage(page) && !canEditWikiPage(session, page))) return wikiResponse(request, { error: 'Wiki page is unavailable.' }, 404);
  if (request.nextUrl.searchParams.get('preview') === 'true') return wikiResponse(request, { id:page.id, slug:page.slug, title:page.title, entity_type:page.entity_type });
  const links = await getWikiLinks(adminDb, page.id);
  return wikiResponse(request, { ...page, sections: page.sections.filter(s => !s.is_hidden || canEditWikiPage(session, page)), wiki_links: links.filter(l => !l.section_hidden || canEditWikiPage(session, page)), backlinks: await getWikiBacklinks(adminDb, page.id), can_edit: canEditWikiPage(session, page) });
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await wikiSession(request);
  if (!session) return wikiResponse(request, { error: 'Sign in to edit a Wiki page.' }, 401);
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  const page = await getWikiEntity(adminDb, (await params).id);
  if (!page) return wikiResponse(request, { error: 'Page is unavailable.' }, 404);
  if (!canEditWikiPage(session, page)) return wikiResponse(request, { error: 'You cannot edit this Wiki page.' }, 403);
  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : page.title;
    if (!title || title.length > 200) return wikiResponse(request, { error: 'A name of 1–200 characters is required.' }, 400);
    const updated = { ...page, title, aliases: Array.isArray(body.aliases) ? body.aliases.filter(a => typeof a === 'string').slice(0,50) : page.aliases || [], summary: typeof body.summary === 'string' ? body.summary : page.summary, sections: Array.isArray(body.sections) ? body.sections : page.sections, updated_by_discord_id: session.discordId, updated_at: new Date().toISOString(), ...(page.character ? { character: { ...page.character, full_name: title } } : {}) };
    return wikiResponse(request, await commitWikiPage(adminDb, updated, session.id || session.discordId || null));
  } catch (err) { return wikiResponse(request, { error: err instanceof Error ? err.message : 'Unable to save page.' }, 409); }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await wikiSession(request);
  if (!session) return wikiResponse(request, { error: 'Sign in to delete a Wiki page.' }, 401);
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  const page = await getWikiEntity(adminDb, (await params).id);
  if (!page) return wikiResponse(request, { error: 'Page is unavailable.' }, 404);
  if (!canEditWikiPage(session, page)) return wikiResponse(request, { error: 'You cannot delete this page.' }, 403);
  await commitWikiPage(adminDb, page, session.id || session.discordId || null, { deleting: true });
  return wikiResponse(request, { success: true });
}
