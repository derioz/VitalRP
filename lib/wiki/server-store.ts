import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  WikiCharacterDetail,
  CharacterStatus,
  WikiSearchResult,
  WikiDirectoryFilter,
} from './types';
import { FALLBACK_CHARACTERS, getFallbackCharacterBySlug, getFallbackSearchResults } from '@/data/wiki-fallback';

export interface CharacterCardItem {
  id: string;
  slug: string;
  title: string;
  full_name: string;
  aliases: string[];
  avatar_url?: string;
  status: CharacterStatus;
  occupation?: string;
  gang?: string;
  business?: string;
  summary?: string;
  categories?: any[];
  updated_at?: string;
  page_views?: number;
}

/**
 * Cleanly strips undefined values for Firestore serialization.
 */
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as any;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean as any;
  }
  return obj;
}

/**
 * Save or update a character in Firestore (and Supabase if migrated).
 */
export async function saveServerCharacter(character: WikiCharacterDetail): Promise<boolean> {
  let saved = false;

  // 1. Primary: Save to Firebase Firestore
  if (adminDb) {
    try {
      const sanitized = sanitizeForFirestore(character);
      const docRef = adminDb.collection('wiki_characters').doc(character.slug);
      const existingSnap = await docRef.get();
      if (existingSnap.exists) {
        const existingData = existingSnap.data();
        // Protect original ownership and creation timestamp from being modified
        if (existingData?.created_by_discord_id) {
          sanitized.created_by_discord_id = existingData.created_by_discord_id;
        }
        if (existingData?.created_by_user_id) {
          sanitized.created_by_user_id = existingData.created_by_user_id;
        }
        if (existingData?.created_at) {
          sanitized.created_at = existingData.created_at;
        }
      }
      await docRef.set(sanitized, { merge: true });
      saved = true;
    } catch (err) {
      console.error('[Wiki Server Store] Firestore save error:', err);
    }
  }

  // 2. Secondary: Attempt Supabase save if wiki_pages table exists
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data: pageRow } = await supabase
        .from('wiki_pages')
        .upsert(
          {
            slug: character.slug,
            title: character.title || character.character?.full_name,
            entity_type: 'character',
            summary: character.summary || '',
            status: character.status || 'active',
            created_by_discord_id: character.created_by_discord_id,
            updated_by_discord_id: character.updated_by_discord_id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        )
        .select('id')
        .maybeSingle();

      if (pageRow?.id) {
        saved = true;
        const c = character.character;
        if (c) {
          await supabase
            .from('wiki_characters')
            .upsert(
              {
                page_id: pageRow.id,
                full_name: c.full_name,
                aliases: c.aliases || [],
                avatar_url: c.avatar_url || '',
                date_of_birth: c.date_of_birth || null,
                pronouns: c.pronouns || null,
                gender: c.gender || null,
                nationality: c.nationality || null,
                occupation: c.occupation || null,
                employer: c.employer || null,
                gang: c.gang || null,
                business: c.business || null,
                residence: c.residence || null,
                relationship_status: c.relationship_status || null,
                player_name: c.player_name || null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'page_id' }
            );
        }
      }
    } catch {
      // Supabase tables might not be migrated yet; ignore
    }
  }

  return saved;
}

/**
 * Fetch a single character by slug from Firestore, Supabase, or Fallback.
 * Enforces draft and archive privacy so anonymous visitors only see published profiles.
 */
export async function getServerCharacterBySlug(
  slug: string,
  options?: { viewerDiscordId?: string; isAdmin?: boolean }
): Promise<WikiCharacterDetail | null> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

  // 1. Fetch from Firebase Firestore
  if (adminDb) {
    try {
      const docRef = adminDb.collection('wiki_characters').doc(cleanSlug);
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data() as WikiCharacterDetail;
        // Verify privacy: if draft or archived, only creator or admin can view
        if (data.is_draft || data.is_archived || data.status === 'archived') {
          const isOwner = Boolean(options?.viewerDiscordId && options.viewerDiscordId === data.created_by_discord_id);
          if (!options?.isAdmin && !isOwner) {
            return null;
          }
        }
        return data;
      }

      // Query by slug field or id in case of case-mismatch
      const qSnap = await adminDb
        .collection('wiki_characters')
        .where('slug', '==', cleanSlug)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        const data = qSnap.docs[0].data() as WikiCharacterDetail;
        if (data.is_draft || data.is_archived || data.status === 'archived') {
          const isOwner = Boolean(options?.viewerDiscordId && options.viewerDiscordId === data.created_by_discord_id);
          if (!options?.isAdmin && !isOwner) {
            return null;
          }
        }
        return data;
      }
    } catch (err) {
      console.warn('[Wiki Server Store] Firestore get error:', err);
    }
  }

  // 2. Fetch from Supabase (if migrated)
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data: page } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (page) {
        const { data: charRow } = await supabase
          .from('wiki_characters')
          .select('*')
          .eq('page_id', page.id)
          .maybeSingle();

        const { data: sections } = await supabase
          .from('wiki_sections')
          .select('*')
          .eq('page_id', page.id)
          .order('sort_order', { ascending: true });

        const { data: gallery } = await supabase
          .from('wiki_images')
          .select('*')
          .eq('page_id', page.id)
          .order('sort_order', { ascending: true });

        return {
          ...page,
          character: charRow || { full_name: page.title, aliases: [] },
          sections: sections || [],
          categories: [],
          relationships: [],
          gallery: gallery || [],
          backlinks: [],
          related_characters: [],
        } as WikiCharacterDetail;
      }
    } catch {
      // Supabase table missing; continue to fallback
    }
  }

  // 3. Fallback
  return getFallbackCharacterBySlug(cleanSlug) || null;
}

/**
 * List characters with filtering, search, sorting, and pagination.
 * Accessible to all visitors (logged in or logged out).
 */
export async function listServerCharacters(filter: WikiDirectoryFilter = {}): Promise<{
  characters: CharacterCardItem[];
  total: number;
  page: number;
  limit: number;
}> {
  const {
    query = '',
    status = 'all',
    category = 'all',
    letter = 'ALL',
    sort = 'name_asc',
    page = 1,
    limit = 16,
  } = filter;

  let allCharacters: CharacterCardItem[] = [];

  // 1. Fetch from Firebase Firestore
  if (adminDb) {
    try {
      const snap = await adminDb.collection('wiki_characters').get();
      snap.forEach((doc) => {
        const d = doc.data() as any;
        // Skip drafts and archived characters from public directory
        if (d.is_draft === true || d.is_archived === true || d.status === 'archived') {
          return;
        }
        const char = d.character || {};
        allCharacters.push({
          id: d.id || doc.id,
          slug: d.slug || doc.id,
          title: d.title || char.full_name || 'Unknown',
          full_name: char.full_name || d.title || 'Unknown',
          aliases: char.aliases || [],
          avatar_url: char.avatar_url || '',
          status: (d.status as CharacterStatus) || 'active',
          occupation: char.occupation || '',
          gang: char.gang || '',
          business: char.business || '',
          summary: d.summary || '',
          categories: d.categories || [],
          updated_at: d.updated_at || d.created_at,
          page_views: d.page_views || 0,
        });
      });
    } catch (err) {
      console.warn('[Wiki Server Store] Firestore list error:', err);
    }
  }

  // 2. Fetch from Supabase (if available and firestore was empty)
  if (allCharacters.length === 0) {
    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('wiki_pages')
          .select(`
            id,
            slug,
            title,
            status,
            summary,
            page_views,
            updated_at,
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
          .eq('is_archived', false);

        if (data && data.length > 0) {
          data.forEach((row: any) => {
            const char = Array.isArray(row.wiki_characters)
              ? row.wiki_characters[0]
              : row.wiki_characters || {};
            allCharacters.push({
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
              updated_at: row.updated_at,
              page_views: row.page_views || 0,
            });
          });
        }
      } catch {
        // Ignore Supabase missing table
      }
    }
  }

  // 3. Merge fallback characters if any exist
  if (FALLBACK_CHARACTERS && FALLBACK_CHARACTERS.length > 0) {
    for (const fb of FALLBACK_CHARACTERS) {
      if (!allCharacters.some((c) => c.slug.toLowerCase() === fb.slug.toLowerCase())) {
        allCharacters.push({
          id: fb.id,
          slug: fb.slug,
          title: fb.title,
          full_name: fb.character.full_name,
          aliases: fb.character.aliases || [],
          avatar_url: fb.character.avatar_url || '',
          status: fb.status,
          occupation: fb.character.occupation || '',
          gang: fb.character.gang || '',
          business: fb.character.business || '',
          summary: fb.summary || '',
          categories: fb.categories || [],
          updated_at: fb.updated_at,
          page_views: fb.page_views || 0,
        });
      }
    }
  }

  // Filter: Status
  let filtered = allCharacters;
  if (status && status !== 'all') {
    filtered = filtered.filter((c) => c.status.toLowerCase() === status.toLowerCase());
  }

  // Filter: Category
  if (category && category !== 'all' && category !== 'characters') {
    const catLower = category.toLowerCase();
    filtered = filtered.filter((c) =>
      Array.isArray(c.categories) &&
      c.categories.some((cat: any) =>
        (cat.slug && cat.slug.toLowerCase() === catLower) ||
        (cat.name && cat.name.toLowerCase() === catLower) ||
        (typeof cat === 'string' && cat.toLowerCase() === catLower)
      )
    );
  }

  // Filter: First letter
  if (letter && letter !== 'ALL') {
    const l = letter.toUpperCase();
    filtered = filtered.filter((c) => (c.full_name || c.title).toUpperCase().startsWith(l));
  }

  // Filter: Search query
  if (query && query.trim()) {
    const qLower = query.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.full_name.toLowerCase().includes(qLower) ||
        c.title.toLowerCase().includes(qLower) ||
        (c.aliases && c.aliases.some((a) => a.toLowerCase().includes(qLower))) ||
        (c.gang && c.gang.toLowerCase().includes(qLower)) ||
        (c.occupation && c.occupation.toLowerCase().includes(qLower)) ||
        (c.summary && c.summary.toLowerCase().includes(qLower))
    );
  }

  // Sort
  if (sort === 'name_desc') {
    filtered.sort((a, b) => b.full_name.localeCompare(a.full_name));
  } else if (sort === 'updated_desc') {
    filtered.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
  } else if (sort === 'popular') {
    filtered.sort((a, b) => (b.page_views || 0) - (a.page_views || 0));
  } else {
    filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  const total = filtered.length;
  const offset = (Math.max(page, 1) - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    characters: paginated,
    total,
    page,
    limit,
  };
}

/**
 * Search characters across Firestore and Supabase.
 */
export async function searchServerCharacters(q: string, limit = 8): Promise<WikiSearchResult[]> {
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return [];

  const listRes = await listServerCharacters({ query: trimmed, limit });
  return listRes.characters.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    full_name: c.full_name,
    aliases: c.aliases || [],
    avatar_url: c.avatar_url || '',
    status: c.status,
    occupation: c.occupation,
    gang: c.gang,
    business: c.business,
    summary: c.summary,
    categories: (c.categories || []).map((cat: any) => cat.name || cat),
  }));
}

/**
 * Delete a character by slug from Firestore and Supabase.
 */
export async function deleteServerCharacter(slug: string): Promise<boolean> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  let deleted = false;

  if (adminDb) {
    try {
      await adminDb.collection('wiki_characters').doc(cleanSlug).delete();
      deleted = true;
    } catch (err) {
      console.error('[Wiki Server Store] Firestore delete error:', err);
    }
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from('wiki_pages').delete().eq('slug', cleanSlug);
      deleted = true;
    } catch {
      // Ignore
    }
  }

  return deleted;
}
