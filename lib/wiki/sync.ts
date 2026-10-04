import { getApiUrl } from '../api-config';
import { supabase } from '../supabase/client';
import { getLocalCharacters, removeLocalCharacter } from './storage';

let syncInFlight: Promise<number> | null = null;

/**
 * Publishes characters that previously only got saved to this browser's
 * localStorage (because of an old silent fallback or CORS interruption) to the Wiki server so they
 * become publicly visible to everyone.
 *
 * Returns the number of characters successfully published.
 */
export function publishLocalCharacters(userIdOrDiscordId?: string | null): Promise<number> {
  if (typeof window === 'undefined') return Promise.resolve(0);
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const allLocal = getLocalCharacters();
    if (!allLocal || allLocal.length === 0) return 0;

    // Filter to characters created locally
    const mine = allLocal.filter((c) => {
      if (!c || !c.slug) return false;
      if (!userIdOrDiscordId) return true;
      const creatorDiscord = c.created_by_discord_id;
      const creatorUser = (c as any).created_by_user_id;
      return (
        !creatorDiscord ||
        creatorDiscord === userIdOrDiscordId ||
        !creatorUser ||
        creatorUser === userIdOrDiscordId
      );
    });

    if (mine.length === 0) return 0;

    const { data: authData } = await supabase.auth.getSession();
    let token = authData?.session?.access_token;
    if (!token) {
      const { data: refreshData } = await supabase.auth.refreshSession();
      token = refreshData?.session?.access_token;
    }
    if (!token) return 0;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    let published = 0;
    for (const local of mine) {
      try {
        // Check if it already exists on server
        const check = await fetch(
          getApiUrl(`/api/wiki/characters/${encodeURIComponent(local.slug)}?preview=true`),
          { cache: 'no-store' }
        );
        if (check.ok) {
          removeLocalCharacter(local.slug);
          continue;
        }
        if (check.status !== 404) continue;

        const c: any = local.character || {};
        const res = await fetch(getApiUrl('/api/wiki/characters'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            full_name: c.full_name || local.title,
            aliases: c.aliases || [],
            status: local.status || 'active',
            summary: local.summary || '',
            avatar_url: c.avatar_url || '',
            avatar_crop: c.avatar_crop || null,
            date_of_birth: c.date_of_birth || '',
            pronouns: c.pronouns || '',
            gender: c.gender || '',
            nationality: c.nationality || '',
            occupation: c.occupation || '',
            employer: c.employer || '',
            gang: c.gang || '',
            business: c.business || '',
            residence: c.residence || '',
            relationship_status: c.relationship_status || '',
            player_name: c.player_name || '',
            sections: local.sections || [],
            relationships: local.relationships || [],
            gallery: local.gallery || [],
          }),
        });

        if (res.ok) {
          removeLocalCharacter(local.slug);
          published++;
          console.info(`[WikiSync] Successfully published local character "${local.slug}" to cloud.`);
        }
      } catch (syncErr) {
        console.warn(`[WikiSync] Could not sync local character "${local.slug}":`, syncErr);
      }
    }
    return published;
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
