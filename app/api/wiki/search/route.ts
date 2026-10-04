export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { searchServerCharacters } from '@/lib/wiki/server-store';
import { adminDb } from '@/lib/firebase/admin';
import { listWikiEntities } from '@/lib/wiki/graph-store';
import { isPublicPage, entityNames, normalizeWikiName } from '@/lib/wiki/link-core';

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
  if (origin !== '*' && origin !== 'null') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request: NextRequest) {
  const corsHeaders = {
    ...getCorsHeaders(request),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 30);

  const type = searchParams.get('type') || '';
  const term = normalizeWikiName(q);
  const results = adminDb
    ? (await listWikiEntities(adminDb)).filter(p => isPublicPage(p) && (!type || p.entity_type === type) && (!term || [...entityNames(p), normalizeWikiName(p.summary || ''), normalizeWikiName(p.character?.occupation || ''), normalizeWikiName(p.character?.gang || ''), normalizeWikiName(p.character?.business || '')].some(n => n.includes(term))))
      .sort((a,b) => Number(entityNames(b).includes(term)) - Number(entityNames(a).includes(term)) || a.title.localeCompare(b.title))
      .slice(0,limit).map(p => ({ id:p.id, slug:p.slug, title:p.title, full_name:p.title, entity_type:p.entity_type, aliases:p.aliases || p.character?.aliases || [], avatar_url:p.character?.avatar_url || '', status:p.status, summary:p.summary, gang:p.character?.gang, occupation:p.character?.occupation, business:p.character?.business }))
    : (await searchServerCharacters(q,limit)).map(p => ({ ...p, entity_type:'character' }));

  return NextResponse.json({ results }, { headers: corsHeaders });
}
