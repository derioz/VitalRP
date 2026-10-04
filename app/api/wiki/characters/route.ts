import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import {
  saveServerCharacter,
  listServerCharacters,
  getServerCharacterBySlug,
  isWikiStorageConfigured,
} from '@/lib/wiki/server-store';
import { WikiCharacterDetail } from '@/lib/wiki/types';

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

/**
 * Public Character Listing API:
 * Completely public and available to everyone (logged in or logged out).
 * Returns only published characters.
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const letter = searchParams.get('letter') || '';
  const sort = (searchParams.get('sort') || 'name_asc') as any;
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(parseInt(searchParams.get('limit') || '16', 10), 50);

  const res = await listServerCharacters({
    query: q,
    status,
    category,
    letter,
    sort,
    page,
    limit,
  });

  return NextResponse.json(res, {
    headers: { ...corsHeaders, 'X-Wiki-Storage': isWikiStorageConfigured() ? 'ok' : 'unavailable' },
  });
}

/**
 * Character Creation API:
 * Protected route: requires authenticated Discord session.
 * Strictly binds created_by_discord_id and created_by_user_id to the verified session to guarantee reliable ownership.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  // 1. Authoritative Server-Side Auth Check: Any logged-in user can create a character
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Discord login is required to create a Wiki character.' },
      { status: 401, headers: corsHeaders }
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
      gallery = [],
      check_duplicates_only = false,
    } = body;

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return NextResponse.json(
        { error: 'Character full name is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const trimmedName = full_name.trim();
    const baseSlug = generateSlug(trimmedName);

    // 2. Check for duplicate characters or similar existing names
    const existing = await getServerCharacterBySlug(baseSlug);

    if (check_duplicates_only) {
      return NextResponse.json(
        {
          exists: Boolean(existing),
          duplicates: existing ? [{ id: existing.id, slug: existing.slug, title: existing.title }] : [],
        },
        { headers: corsHeaders }
      );
    }

    // 3. Ensure slug uniqueness
    let finalSlug = baseSlug;
    if (existing) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const createdPageId = `char-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Prepare default sections if none provided
    const preparedSections =
      Array.isArray(sections) && sections.length > 0
        ? sections.map((s: any, idx: number) => ({
            id: s.id || `sec-${idx}`,
            page_id: createdPageId,
            section_key: s.section_key || `custom_${idx}`,
            title: s.title || 'Section',
            content_html: s.content_html || '',
            sort_order: s.sort_order || idx + 1,
            is_hidden: Boolean(s.is_hidden),
          }))
        : [
            {
              id: 'sec-0',
              page_id: createdPageId,
              section_key: 'overview',
              title: 'Overview',
              content_html: `<p><strong>${trimmedName}</strong> is a citizen in Los Santos.</p>`,
              sort_order: 1,
              is_hidden: false,
            },
            {
              id: 'sec-1',
              page_id: createdPageId,
              section_key: 'biography',
              title: 'Biography & History',
              content_html: '<p>Biography coming soon.</p>',
              sort_order: 2,
              is_hidden: false,
            },
          ];

    const preparedCategories = (Array.isArray(categories) ? categories : ['characters']).map((cat: any) => {
      if (typeof cat === 'string') {
        return { id: cat, slug: cat, name: cat, description: '', icon: 'Users' };
      }
      return cat;
    });

    // Reliably store the authenticated Discord ID as the immutable character owner
    const characterPayload: WikiCharacterDetail = {
      id: createdPageId,
      slug: finalSlug,
      title: trimmedName,
      entity_type: 'character',
      summary: summary || `${trimmedName} is a citizen of Los Santos.`,
      status: (status as any) || 'active',
      is_archived: false,
      is_draft: false,
      page_views: 0,
      created_by_discord_id: session.discordId, // Server authoritative owner
      created_by_user_id: session.id || session.discordId,
      updated_by_discord_id: session.discordId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      character: {
        page_id: createdPageId,
        full_name: trimmedName,
        aliases: Array.isArray(aliases) ? aliases : [],
        avatar_url: avatar_url || '',
        avatar_crop: avatar_crop || null,
        date_of_birth: date_of_birth || '',
        pronouns: pronouns || '',
        gender: gender || '',
        nationality: nationality || '',
        occupation: occupation || '',
        employer: employer || '',
        gang: gang || '',
        business: business || '',
        residence: residence || '',
        relationship_status: relationship_status || '',
        player_name: player_name || session.displayName || session.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      sections: preparedSections,
      categories: preparedCategories,
      relationships: Array.isArray(relationships) ? relationships : [],
      gallery: Array.isArray(gallery) ? gallery : [],
      backlinks: [],
      related_characters: [],
    };

    // 4. Save to persistent server store. Never report success unless it was
    // actually persisted, otherwise the profile would be invisible to the public.
    const persisted = await saveServerCharacter(characterPayload);
    if (!persisted) {
      return NextResponse.json(
        {
          error:
            'Storage error: the character could not be saved to the Wiki database. Please try again or contact staff.',
        },
        { status: 503, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: createdPageId,
        slug: finalSlug,
        title: trimmedName,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Wiki Characters API POST] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create character.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
