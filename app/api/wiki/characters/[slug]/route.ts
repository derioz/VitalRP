import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import {
  getServerCharacterBySlug,
  saveServerCharacter,
  deleteServerCharacter,
} from '@/lib/wiki/server-store';
import { WikiCharacterDetail } from '@/lib/wiki/types';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Public Character Detail View:
 * Completely public and accessible to everyone across the internet (logged in or logged out).
 * Anonymous visitors can view biographies, relationships, galleries, backlinks, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  const { slug } = await params;
  const isPreview = request.nextUrl.searchParams.get('preview') === 'true';

  // Optional session lookup for draft/owner check without requiring authentication
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = token ? await getCurrentSession(token).catch(() => null) : null;

  const character = await getServerCharacterBySlug(slug, {
    viewerDiscordId: session?.discordId,
    isAdmin: Boolean(session?.isAdmin || session?.isSuperAdmin),
  });

  if (!character) {
    return NextResponse.json({ error: 'Character not found.' }, { status: 404, headers: corsHeaders });
  }

  if (isPreview) {
    return NextResponse.json(
      {
        id: character.id,
        slug: character.slug,
        title: character.title,
        status: character.status,
        character: character.character,
      },
      { headers: corsHeaders }
    );
  }

  return NextResponse.json(character, { headers: corsHeaders });
}

/**
 * Character Editing / Updating:
 * Requires authenticated Discord login + Ownership (or Admin override).
 * A user cannot edit another user's character.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  const { slug } = await params;

  // 1. Authoritative Auth Check
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Discord login is required to edit Wiki pages.' },
      { status: 401, headers: corsHeaders }
    );
  }

  const existing = await getServerCharacterBySlug(slug, { isAdmin: true });
  if (!existing) {
    return NextResponse.json(
      { error: 'Character not found to edit.' },
      { status: 404, headers: corsHeaders }
    );
  }

  // 2. Strict Ownership / Admin Check:
  // - Admin or SuperAdmin can always moderate / edit.
  // - Logged in users can edit characters they personally created/own.
  const isCreator = Boolean(
    (existing.created_by_discord_id &&
      session.discordId &&
      existing.created_by_discord_id === session.discordId) ||
    (existing.created_by_user_id &&
      session.id &&
      existing.created_by_user_id === session.id) ||
    (existing.character?.player_name &&
      (session.displayName || session.username) &&
      existing.character.player_name.trim().toLowerCase() === (session.displayName || session.username || '').trim().toLowerCase())
  );
  const isAdmin = session.isSuperAdmin || session.isAdmin || session.effectivePermissions.includes('wiki.moderate');

  const canEdit = isAdmin || isCreator;

  if (!canEdit) {
    return NextResponse.json(
      {
        error: 'Forbidden: You do not own this character profile. Only the character creator or staff administrators can modify it.',
      },
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const {
      full_name,
      aliases,
      status,
      summary,
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
      sections,
      categories,
      relationships,
      gallery,
    } = body;

    const trimmedName = (full_name || existing.character?.full_name || existing.title).trim();

    const updatedCharacter: WikiCharacterDetail = {
      ...existing,
      title: trimmedName,
      summary: summary !== undefined ? summary : existing.summary,
      status: status || existing.status,
      created_by_discord_id: existing.created_by_discord_id, // Immutable owner
      created_by_user_id: existing.created_by_user_id || session.id,
      updated_by_discord_id: session.discordId,
      updated_at: new Date().toISOString(),
      character: {
        ...existing.character,
        full_name: trimmedName,
        aliases: aliases !== undefined ? (Array.isArray(aliases) ? aliases : []) : existing.character?.aliases || [],
        avatar_url: avatar_url !== undefined ? avatar_url : existing.character?.avatar_url || '',
        avatar_crop: avatar_crop !== undefined ? avatar_crop : existing.character?.avatar_crop || null,
        date_of_birth: date_of_birth !== undefined ? date_of_birth : existing.character?.date_of_birth || '',
        pronouns: pronouns !== undefined ? pronouns : existing.character?.pronouns || '',
        gender: gender !== undefined ? gender : existing.character?.gender || '',
        nationality: nationality !== undefined ? nationality : existing.character?.nationality || '',
        occupation: occupation !== undefined ? occupation : existing.character?.occupation || '',
        employer: employer !== undefined ? employer : existing.character?.employer || '',
        gang: gang !== undefined ? gang : existing.character?.gang || '',
        business: business !== undefined ? business : existing.character?.business || '',
        residence: residence !== undefined ? residence : existing.character?.residence || '',
        relationship_status: relationship_status !== undefined ? relationship_status : existing.character?.relationship_status || '',
        player_name: player_name || existing.character?.player_name || session.displayName || session.username,
        updated_at: new Date().toISOString(),
      },
      sections: sections !== undefined ? sections : existing.sections || [],
      categories: categories !== undefined ? categories : existing.categories || [],
      relationships: relationships !== undefined ? relationships : existing.relationships || [],
      gallery: gallery !== undefined ? gallery : existing.gallery || [],
    };

    const persisted = await saveServerCharacter(updatedCharacter);
    if (!persisted) {
      return NextResponse.json(
        { error: 'Storage error: changes could not be saved to the Wiki database. Please try again.' },
        { status: 503, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        slug: existing.slug,
        title: trimmedName,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Wiki Character Detail API PUT] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update character.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Character Deletion:
 * Requires creator ownership or Administrator permissions.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  const { slug } = await params;

  // 1. Authoritative Auth Check
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Discord login is required to delete Wiki characters.' },
      { status: 401, headers: corsHeaders }
    );
  }

  const existing = await getServerCharacterBySlug(slug, { isAdmin: true });
  if (!existing) {
    return NextResponse.json(
      { error: 'Character not found.' },
      { status: 404, headers: corsHeaders }
    );
  }

  const isCreator = Boolean(
    (existing.created_by_discord_id &&
      session.discordId &&
      existing.created_by_discord_id === session.discordId) ||
    (existing.created_by_user_id &&
      session.id &&
      existing.created_by_user_id === session.id) ||
    (existing.character?.player_name &&
      (session.displayName || session.username) &&
      existing.character.player_name.trim().toLowerCase() === (session.displayName || session.username || '').trim().toLowerCase())
  );
  const isAdmin = session.isSuperAdmin || session.isAdmin || session.effectivePermissions.includes('wiki.moderate');

  const canDelete = isAdmin || isCreator;

  if (!canDelete) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to delete this character.' },
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    await deleteServerCharacter(slug);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('[Wiki Character Detail API DELETE] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete character.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
