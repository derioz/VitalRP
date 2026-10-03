import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFallbackCharacterBySlug } from '@/data/wiki-fallback';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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
                    full_name: srcChar?.full_name || srcPage.title,
                    avatar_url: srcChar?.avatar_url,
                    status: srcPage.status,
                    gang: srcChar?.gang,
                    occupation: srcChar?.occupation,
                  }
                : undefined,
            };
          });

          return NextResponse.json({
            pageTitle: page.title,
            slug: page.slug,
            backlinks: formatted,
          });
        }
      }
    } catch (err) {
      console.warn('[Wiki Backlinks API] Supabase error:', err);
    }
  }

  // Fallback
  const fallback = getFallbackCharacterBySlug(slug);
  return NextResponse.json({
    pageTitle: fallback?.title || slug,
    slug,
    backlinks: fallback?.backlinks || [],
  });
}
