export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { commitWikiPage, getWikiEntity } from '@/lib/wiki/graph-store';
import { canEditWikiPage } from '@/lib/wiki/permissions';
import { wikiOptions, wikiResponse, wikiSession } from '@/lib/wiki/api';
import { WikiLink } from '@/lib/wiki/types';
export const OPTIONS = wikiOptions;
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await wikiSession(request);
  if (!session) return wikiResponse(request, { error: 'Sign in to edit Wiki links.' }, 401);
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  const id = (await params).id;
  if (!/^[\w-]{1,120}$/.test(id)) return wikiResponse(request, { error: 'Invalid link ID.' }, 400);
  const snap = await adminDb.collection('wiki_links').doc(id).get();
  const link = snap.data() as WikiLink | undefined;
  const page = link ? await getWikiEntity(adminDb, link.source_page_id) : null;
  if (!page) return wikiResponse(request, { error: 'Link is unavailable.' }, 404);
  if (!canEditWikiPage(session, page)) return wikiResponse(request, { error: 'You cannot edit links on this page.' }, 403);
  try {
    const body = await request.json();
    if (!['target', 'remove', 'leave'].includes(body.action) || (body.action === 'target' && typeof body.targetId !== 'string') || (body.displayName !== undefined && typeof body.displayName !== 'string')) return wikiResponse(request, { error: 'Invalid link action.' }, 400);
    await commitWikiPage(adminDb, page, session.id || session.discordId || null, { linkEdit: { id, action: body.action, targetId: body.targetId, displayName: body.displayName } });
    return wikiResponse(request, { success: true });
  } catch (err) { return wikiResponse(request, { error: err instanceof Error ? err.message : 'Unable to edit link.' }, 409); }
}
