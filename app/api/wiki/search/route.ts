import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFallbackSearchResults } from '@/data/wiki-fallback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 30);

  const supabase = createAdminClient();

  if (supabase) {
    try {
      const trimmed = q.trim();
      let queryBuilder = supabase
        .from('wiki_pages')
        .select(`
          id,
          slug,
          title,
          status,
          summary,
          wiki_characters (
            full_name,
            aliases,
            avatar_url,
            occupation,
            gang,
            business
          )
        `)
        .eq('entity_type', 'character')
        .eq('is_archived', false)
        .limit(limit);

      if (trimmed) {
        // Search title, or wildcard ILIKE
        queryBuilder = queryBuilder.ilike('title', `%${trimmed}%`);
      }

      const { data, error } = await queryBuilder;

      if (!error && data && data.length > 0) {
        const results = data.map((row: any) => {
          const char = Array.isArray(row.wiki_characters)
            ? row.wiki_characters[0]
            : row.wiki_characters || {};
          return {
            id: row.id,
            slug: row.slug,
            title: row.title,
            full_name: char.full_name || row.title,
            aliases: char.aliases || [],
            avatar_url: char.avatar_url || '',
            status: row.status,
            occupation: char.occupation || '',
            gang: char.gang || '',
            business: char.business || '',
            summary: row.summary || '',
          };
        });

        return NextResponse.json({ results });
      }
    } catch (err) {
      console.warn('[Wiki Search API] Supabase search error, falling back to static index:', err);
    }
  }

  // Graceful fallback to static index
  const fallbackResults = getFallbackSearchResults(q).slice(0, limit);
  return NextResponse.json({ results: fallbackResults });
}
