export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { adminDb } from '@/lib/firebase/admin';
import { commitWikiPage, listWikiEntities, WikiConflictError } from '@/lib/wiki/graph-store';
import { isPublicPage, normalizeWikiName } from '@/lib/wiki/link-core';
import { wikiOptions, wikiResponse, wikiSession } from '@/lib/wiki/api';
import { WikiEntityDetail } from '@/lib/wiki/types';
export const OPTIONS = wikiOptions;
export async function GET(request: NextRequest) {
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  const type = request.nextUrl.searchParams.get('type');
  const q = normalizeWikiName(request.nextUrl.searchParams.get('q') || '');
  const pages = (await listWikiEntities(adminDb)).filter(p => isPublicPage(p) && (!type || p.entity_type === type) && (!q || normalizeWikiName(p.title).includes(q)));
  return wikiResponse(request, { pages: pages.map(({ id, slug, title, entity_type, summary }) => ({ id, slug, title, entity_type, summary })) });
}
export async function POST(request: NextRequest) {
  const session = await wikiSession(request);
  if (!session) return wikiResponse(request, { error: 'Sign in to create a Wiki page.' }, 401);
  if (!adminDb) return wikiResponse(request, { error: 'Wiki storage is unavailable.' }, 503);
  try {
    const body = await request.json();
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 || typeof body.entity_type !== 'string' || !/^[a-z][a-z0-9_-]{0,49}$/.test(body.entity_type)) return wikiResponse(request, { error: 'A name and valid entity type are required.' }, 400);
    const now = new Date().toISOString();
    const id = randomUUID();
    const title = body.title.trim();
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || id;
    const pages = await listWikiEntities(adminDb);
    const page: WikiEntityDetail = {
      id, slug: pages.some(p => p.slug === slug && p.entity_type === body.entity_type) ? `${slug}-${id.slice(0,8)}` : slug,
      title, entity_type: body.entity_type, aliases: Array.isArray(body.aliases) ? body.aliases.filter(a => typeof a === 'string').slice(0,50) : [],
      summary: typeof body.summary === 'string' ? body.summary : '', status: 'active', is_archived: false, is_draft: Boolean(body.is_draft), page_views: 0,
      created_by_discord_id: session.discordId || session.id || '', created_by_user_id: session.id, updated_by_discord_id: session.discordId,
      created_at: now, updated_at: now, sections: Array.isArray(body.sections) ? body.sections : [],
      ...(body.entity_type === 'character' ? { character: { page_id: id, full_name: title, aliases: body.aliases || [], avatar_url: '' }, categories: [], relationships: [], gallery: [] } : {}),
    };
    const saved = await commitWikiPage(adminDb, page, session.id || session.discordId || null, { create: true });
    return wikiResponse(request, saved, 201);
  } catch (err) {
    return wikiResponse(request, { error: err instanceof Error ? err.message : 'Unable to create page.' }, err instanceof WikiConflictError ? 409 : 500);
  }
}
