import { getApiUrl } from '../api-config';
import { supabase } from '../supabase/client';
import { getLocalCharacters, removeLocalCharacter } from './storage';

let syncInFlight: Promise<number> | null = null;

/**
 * Publishes characters that previously only got saved to this browser's
 * localStorage (because of an old silent fallback) to the Wiki server so they
 * become publicly visible. Only characters created by the signed-in user are
 * sent; the server still enforces Whitelist + ownership and assigns the owner
 * from the authenticated session.
 *
 * Returns the number of characters successfully published.
 */
export function publishLocalCharacters(discordId: string | undefined | null): Promise<number> {
  if (typeof window === 'undefined' || !discordId) return Promise.resolve(0);
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const mine = getLocalCharacters().filter(
      (c) => c && c.slug && (!c.created_by_discord_id || c.created_by_discord_id === discordId)
    );
    if (mine.length === 0) return 0;

    const { data: authData } = await supabase.auth.getSession();
    const token = authData?.session?.access_token;
    if (!token) return 0;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    let published = 0;
    for (const local of mine) {
      try {
        // Already on the server? Then the local copy is just stale cache.
        const check = await fetch(getApiUrl(`/api/wiki/characters/${encodeURIComponent(local.slug)}?preview=true`));
        if (check.ok) {
          removeLocalCharacter(local.slug);
          continue;
        }
        if (check.status !== 404) continue;

        const c: any = local.character || {};
        const res = await fetch(getApiUrl('/api/wiki/characters'), {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            full_name: c.full_name || local.title,
            aliases: c.aliases || [],
            status: local.status || 'active',
            summary: local.summary || '',
            avatar_url: c.avatar_url || '',
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
        }
        // On 401/403/503 keep the local copy so nothing is lost.
      } catch {
        // Network error: keep local copy and try again next time.
      }
    }
    return published;
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
