import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FALLBACK_WIKI_CATEGORIES } from '@/data/wiki-fallback';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('wiki_categories')
        .select(`
          id,
          slug,
          name,
          description,
          icon,
          is_system,
          wiki_page_categories (
            page_id
          )
        `);

      if (!error && data && data.length > 0) {
        const categories = data.map((cat: any) => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          description: cat.description || '',
          icon: cat.icon || 'Users',
          is_system: cat.is_system,
          count: Array.isArray(cat.wiki_page_categories) ? cat.wiki_page_categories.length : 0,
        }));
        return NextResponse.json({ categories }, { headers: corsHeaders });
      }
    } catch (err) {
      console.warn('[Wiki Categories API] Supabase error, falling back to static categories:', err);
    }
  }

  return NextResponse.json({ categories: FALLBACK_WIKI_CATEGORIES }, { headers: corsHeaders });
}
