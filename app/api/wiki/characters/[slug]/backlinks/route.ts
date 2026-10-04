export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFallbackCharacterBySlug } from '@/data/wiki-fallback';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const corsHeaders = {
    ...getCorsHeaders(request),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };

  const { slug } = await params;
  const supabase = createAdminClient();

  if (supabase) {
    try {
      // Find page
      const { data: page } = await supabase
        .from('wiki_pages')
        .select('id, title, slug')
        .eq('slug', slug.toLowerCase())
        .maybeSingle();

      if (page) {
        const { data: backlinks, error } = await supabase
          .from('wiki_links')
          .select(`
            id,
            source_page_id,
            target_page_id,
            section_key,
            context_snippet,
            created_at,
            source:source_page_id (
              id,
              slug,
              title,
              status,
              wiki_characters (
                full_name,
                avatar_url,
                gang,
                occupation
              )
            )
          `)
          .eq('target_page_id', page.id);

        if (!error && backlinks) {
          const formatted = backlinks.map((b: any) => {
            const srcPage = b.source;
            const srcChar = Array.isArray(srcPage?.wiki_characters)
              ? srcPage?.wiki_characters[0]
              : srcPage?.wiki_characters;

            return {
              id: b.id,
              source_page_id: b.source_page_id,
              target_page_id: b.target_page_id,
              section_key: b.section_key,
              context_snippet: b.context_snippet,
              created_at: b.created_at,
              source: srcPage
                ? {
                    id: srcPage.id,
                    slug: srcPage.slug,
                    title: srcPage.title,
                    status: srcPage.status,
                    full_name: srcChar?.full_name || srcPage.title,
                    avatar_url: srcChar?.avatar_url,
                    occupation: srcChar?.occupation,
                    gang: srcChar?.gang,
                  }
                : null,
            };
          }).filter((b: any) => Boolean(b.source));

          return NextResponse.json({ backlinks: formatted }, { headers: corsHeaders });
        }
      }
    } catch {
      // Fallback
    }
  }

  // Fallback for mock data / offline
  const fallback = getFallbackCharacterBySlug(slug);
  return NextResponse.json({ backlinks: fallback?.backlinks || [] }, { headers: corsHeaders });
}
