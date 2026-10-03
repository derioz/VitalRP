import { WikiCharacterDetail, WikiSearchResult } from './types';

const STORAGE_KEY = 'vital_wiki_custom_characters';

export function getLocalCharacters(): WikiCharacterDetail[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalCharacter(character: WikiCharacterDetail): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalCharacters();
    const charSlug = (character.slug || '').toLowerCase().trim();
    const charId = (character.id || '').toLowerCase().trim();
    const charName = (character.character?.full_name || character.title || '').toLowerCase().trim();

    const existingIndex = current.findIndex((c) => {
      const cSlug = (c.slug || '').toLowerCase().trim();
      const cId = (c.id || '').toLowerCase().trim();
      const cName = (c.character?.full_name || c.title || '').toLowerCase().trim();
      return (
        (charId && cId === charId) ||
        (charSlug && cSlug === charSlug) ||
        (charName && cName === charName)
      );
    });

    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...character, updated_at: new Date().toISOString() };
    } else {
      current.unshift(character);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save character to local storage:', err);
  }
}

export function getLocalCharacterBySlug(slug: string): WikiCharacterDetail | null {
  if (typeof window === 'undefined' || !slug) return null;
  const list = getLocalCharacters();
  const rawTarget = decodeURIComponent(slug).toLowerCase().trim();
  const normalizedTarget = rawTarget
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return (
    list.find((c) => {
      if (!c) return false;
      const cSlug = (c.slug || '').toLowerCase().trim();
      const cNormalizedSlug = cSlug.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      const cTitle = (c.title || '').toLowerCase().trim();
      const cFullName = (c.character?.full_name || '').toLowerCase().trim();
      const cId = (c.id || '').toLowerCase().trim();

      return (
        cSlug === rawTarget ||
        cSlug === normalizedTarget ||
        cNormalizedSlug === normalizedTarget ||
        cTitle === rawTarget ||
        cTitle === normalizedTarget ||
        cFullName === rawTarget ||
        cFullName === normalizedTarget ||
        cId === rawTarget
      );
    }) || null
  );
}

export function removeLocalCharacter(slug: string): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const current = getLocalCharacters();
    const rawTarget = decodeURIComponent(slug).toLowerCase().trim();
    const normalizedTarget = rawTarget.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const filtered = current.filter((c) => {
      const cSlug = (c.slug || '').toLowerCase().trim();
      const cId = (c.id || '').toLowerCase().trim();
      return cSlug !== rawTarget && cSlug !== normalizedTarget && cId !== rawTarget;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

export function clearAllLocalCharacters(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function mergeWithLocalCharacters(apiCharacters: WikiCharacterDetail[]): WikiCharacterDetail[] {
  const localList = getLocalCharacters();
  if (localList.length === 0) return apiCharacters;

  const map = new Map<string, WikiCharacterDetail>();
  // Put API characters first
  for (const c of apiCharacters) {
    map.set(c.slug.toLowerCase(), c);
  }
  // Local characters take precedence or augment
  for (const c of localList) {
    map.set(c.slug.toLowerCase(), c);
  }

  return Array.from(map.values());
}

export function localCharactersToSearchResults(characters: WikiCharacterDetail[]): WikiSearchResult[] {
  return characters.map((c) => ({
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
    categories: c.categories.map((cat) => cat.name),
  }));
}
