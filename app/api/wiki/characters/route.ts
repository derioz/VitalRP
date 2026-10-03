import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { FALLBACK_CHARACTERS, getFallbackSearchResults } from '@/data/wiki-fallback';
import { extractMentionIds, extractMentionSnippet } from '@/lib/wiki/mentions';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const letter = searchParams.get('letter') || '';
  const sort = searchParams.get('sort') || 'name_asc';
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(parseInt(searchParams.get('limit') || '16', 10), 50);

  const supabase = createAdminClient();

  if (supabase) {
    try {
      let query = supabase
        .from('wiki_pages')
        .select(`
          id,
          slug,
          title,
          status,
          summary,
          page_views,
          created_at,
          updated_at,
          wiki_characters (
            full_name,
            aliases,
            avatar_url,
            occupation,
            gang,
            business
          ),
          wiki_page_categories (
            category_id,
            wiki_categories (
              id,
              slug,
              name
            )
          )
        `, { count: 'exact' })
        .eq('entity_type', 'character')
        .eq('is_archived', false);

      // Filters
      if (status && status !== 'all') {
        query = query.eq('status', status.toLowerCase());
      }

      if (letter) {
        query = query.ilike('title', `${letter}%`);
      }

      if (q) {
        query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
      }

      // Sort
      if (sort === 'name_desc') {
        query = query.order('title', { ascending: false });
      } else if (sort === 'updated_desc') {
        query = query.order('updated_at', { ascending: false });
      } else if (sort === 'popular') {
        query = query.order('page_views', { ascending: false });
      } else {
        query = query.order('title', { ascending: true });
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (!error && data && data.length > 0) {
        const characters = data.map((row: any) => {
          const char = Array.isArray(row.wiki_characters)
            ? row.wiki_characters[0]
            : row.wiki_characters || {};
          const categories = Array.isArray(row.wiki_page_categories)
            ? row.wiki_page_categories.map((c: any) => c.wiki_categories).filter(Boolean)
            : [];

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
            categories,
            updated_at: row.updated_at,
          };
        });

        // Filter by category if requested
        const filtered = category && category !== 'all' && category !== 'characters'
          ? characters.filter((c: any) => c.categories.some((cat: any) => cat.slug === category || cat.id === category))
          : characters;

        return NextResponse.json({
          characters: filtered,
          total: count || filtered.length,
          page,
          limit,
        });
      }
    } catch (err) {
      console.warn('[Wiki Characters API] Supabase error, falling back to static roster:', err);
    }
  }

  // Graceful fallback from static characters
  let results = [...FALLBACK_CHARACTERS];

  if (status && status !== 'all') {
    results = results.filter((c) => c.status.toLowerCase() === status.toLowerCase());
  }

  if (category && category !== 'all' && category !== 'characters') {
    results = results.filter((c) => c.categories.some((cat) => cat.slug === category || cat.id === category));
  }

  if (letter) {
    results = results.filter((c) => c.character.full_name.toUpperCase().startsWith(letter.toUpperCase()));
  }

  if (q) {
    const qLower = q.toLowerCase();
    results = results.filter((c) =>
      c.character.full_name.toLowerCase().includes(qLower) ||
      c.character.aliases.some((a) => a.toLowerCase().includes(qLower)) ||
      c.character.gang?.toLowerCase().includes(qLower) ||
      c.character.occupation?.toLowerCase().includes(qLower) ||
      c.summary.toLowerCase().includes(qLower)
    );
  }

  if (sort === 'name_desc') {
    results.sort((a, b) => b.character.full_name.localeCompare(a.character.full_name));
  } else if (sort === 'updated_desc') {
    results.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } else if (sort === 'popular') {
    results.sort((a, b) => (b.page_views || 0) - (a.page_views || 0));
  } else {
    results.sort((a, b) => a.character.full_name.localeCompare(b.character.full_name));
  }

  const offset = (page - 1) * limit;
  const paginated = results.slice(offset, offset + limit).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    full_name: c.character.full_name,
    aliases: c.character.aliases,
    avatar_url: c.character.avatar_url,
    status: c.status,
    occupation: c.character.occupation,
    gang: c.character.gang,
    business: c.character.business,
    summary: c.summary,
    categories: c.categories,
    updated_at: c.updated_at,
  }));

  return NextResponse.json({
    characters: paginated,
    total: results.length,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  // 1. Authoritative Auth Check
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Discord login is required to create a Wiki character.' }, { status: 401 });
  }

  const canCreate =
    session.isSuperAdmin ||
    session.isAdmin ||
    session.effectivePermissions.includes('wiki.create') ||
    session.matchedRoleNames.some((r) => r.toLowerCase().includes('whitelist'));

  if (!canCreate) {
    return NextResponse.json(
      { error: 'Forbidden: Whitelist Approved role or staff permission is required to create Wiki characters.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      full_name,
      aliases = [],
      status = 'active',
      summary = '',
      avatar_url = '',
      avatar_crop = null,
      date_of_birth = '',
      pronouns = '',
      gender = '',
      nationality = '',
      occupation = '',
      employer = '',
      gang = '',
      business = '',
      residence = '',
      relationship_status = '',
      player_name = session.displayName || session.username,
      sections = [],
      categories = ['characters'],
      relationships = [],
      check_duplicates_only = false,
    } = body;

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return NextResponse.json({ error: 'Character full name is required.' }, { status: 400 });
    }

    const trimmedName = full_name.trim();
    const baseSlug = generateSlug(trimmedName);

    const supabase = createAdminClient();

    // 2. Check for duplicate characters or similar existing names
    let potentialDuplicates: any[] = [];
    if (supabase) {
      const { data: similarPages } = await supabase
        .from('wiki_pages')
        .select('id, slug, title')
        .ilike('title', `%${trimmedName}%`)
        .limit(5);

      if (similarPages && similarPages.length > 0) {
        potentialDuplicates = similarPages;
      }
    } else {
      potentialDuplicates = FALLBACK_CHARACTERS
        .filter((c) => c.character.full_name.toLowerCase().includes(trimmedName.toLowerCase()))
        .map((c) => ({ id: c.id, slug: c.slug, title: c.title }));
    }

    if (check_duplicates_only) {
      return NextResponse.json({
        exists: potentialDuplicates.some((d) => d.title.toLowerCase() === trimmedName.toLowerCase()),
        duplicates: potentialDuplicates,
      });
    }

    // 3. Ensure slug uniqueness
    let finalSlug = baseSlug;
    if (supabase) {
      const { data: existingSlug } = await supabase
        .from('wiki_pages')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();

      if (existingSlug) {
        finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    let createdPageId = '';

    // 4. Insert into database
    if (supabase) {
      // 4a. Create wiki_pages row
      const { data: pageRow, error: pageErr } = await supabase
        .from('wiki_pages')
        .insert({
          slug: finalSlug,
          title: trimmedName,
          entity_type: 'character',
          summary: summary || `${trimmedName} is a citizen of Los Santos.`,
          status,
          created_by_discord_id: session.discordId,
          updated_by_discord_id: session.discordId,
        })
        .select('id')
        .single();

      if (pageErr || !pageRow) {
        throw new Error(`Failed to create wiki page: ${pageErr?.message}`);
      }

      createdPageId = pageRow.id;

      // 4b. Create wiki_characters row
      await supabase.from('wiki_characters').insert({
        page_id: createdPageId,
        full_name: trimmedName,
        aliases: Array.isArray(aliases) ? aliases : [],
        avatar_url,
        avatar_crop,
        date_of_birth,
        pronouns,
        gender,
        nationality,
        occupation,
        employer,
        gang,
        business,
        residence,
        relationship_status,
        player_name,
      });

      // 4c. Create default/custom sections
      const sectionsToInsert = Array.isArray(sections) && sections.length > 0
        ? sections
        : [
            {
              section_key: 'overview',
              title: 'Overview',
              content_html: `<p><strong>${trimmedName}</strong> is a resident in Los Santos.</p>`,
              sort_order: 1,
            },
            {
              section_key: 'biography',
              title: 'Biography & History',
              content_html: '<p>Biography coming soon.</p>',
              sort_order: 2,
            },
          ];

      const sectionRows = sectionsToInsert.map((s: any, idx: number) => ({
        page_id: createdPageId,
        section_key: s.section_key || `custom_${idx}`,
        title: s.title || 'Section',
        content_html: s.content_html || '',
        content_json: s.content_json || {},
        sort_order: s.sort_order || idx + 1,
        is_hidden: Boolean(s.is_hidden),
      }));

      await supabase.from('wiki_sections').insert(sectionRows);

      // 4d. Associate categories
      const categoryRows = (Array.isArray(categories) ? categories : ['characters']).map((catId: string) => ({
        page_id: createdPageId,
        category_id: catId,
      }));
      await supabase.from('wiki_page_categories').insert(categoryRows);

      // 4e. Record relationships
      if (Array.isArray(relationships) && relationships.length > 0) {
        const relRows = relationships.map((r: any) => ({
          page_id: createdPageId,
          target_page_id: r.target_page_id,
          relationship_type: r.relationship_type,
          description: r.description || '',
        }));
        await supabase.from('wiki_relationships').insert(relRows);
      }

      // 4f. Synchronize link graph for backlinks
      for (const sec of sectionRows) {
        const mentionedIds = extractMentionIds(sec.content_html);
        for (const targetId of mentionedIds) {
          const snippet = extractMentionSnippet(sec.content_html, targetId);
          try {
            await supabase.from('wiki_links').insert({
              source_page_id: createdPageId,
              target_page_id: targetId,
              section_key: sec.section_key,
              context_snippet: snippet,
            });
          } catch {
            // Ignore non-critical index insertion errors
          }
        }
      }

      // 4g. Store initial revision
      await supabase.from('wiki_revisions').insert({
        page_id: createdPageId,
        revision_number: 1,
        title: trimmedName,
        summary: 'Initial character creation',
        snapshot_data: {
          character: { full_name: trimmedName, aliases, occupation, gang, business },
          sections: sectionRows,
          categories,
          relationships,
        },
        editor_discord_id: session.discordId,
        editor_name: session.displayName || session.username,
      });
    }

    return NextResponse.json({
      success: true,
      pageId: createdPageId,
      slug: finalSlug,
      title: trimmedName,
      potentialDuplicates: potentialDuplicates.length > 0 ? potentialDuplicates : undefined,
    });
  } catch (err: any) {
    console.error('[Wiki Characters API POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create character.' }, { status: 500 });
  }
}
