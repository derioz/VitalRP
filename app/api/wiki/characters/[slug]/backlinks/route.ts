export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerCharacterBySlug } from '@/lib/wiki/server-store';
import { getWikiBacklinks } from '@/lib/wiki/graph-store';
import { wikiOptions, wikiResponse } from '@/lib/wiki/api';
export const OPTIONS = wikiOptions;
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const page = await getServerCharacterBySlug((await params).slug);
  if (!page) return wikiResponse(request, { error: 'Wiki page is unavailable.' }, 404);
  return wikiResponse(request, { pageTitle:page.title, backlinks:adminDb ? await getWikiBacklinks(adminDb,page.id) : page.backlinks || [] });
}
