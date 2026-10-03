import { WikiCategory, WikiCharacterDetail, WikiSearchResult } from '../lib/wiki/types';

export const FALLBACK_WIKI_CATEGORIES: WikiCategory[] = [
  { id: 'characters', slug: 'characters', name: 'All Characters', description: 'Complete roster of active, inactive, and deceased characters in Los Santos', icon: 'Users', is_system: true, count: 0 },
  { id: 'criminal', slug: 'criminal', name: 'Criminals & Heisters', description: 'Underworld operators, crews, and convicted criminals', icon: 'Flame', is_system: true, count: 0 },
  { id: 'gang', slug: 'gang', name: 'Gangs & Syndicates', description: 'Recognized illegal factions, street gangs, and cartels', icon: 'Swords', is_system: true, count: 0 },
  { id: 'police', slug: 'police', name: 'Law Enforcement (LSPD / BCSO)', description: 'Sworn peace officers, detectives, and command staff', icon: 'Shield', is_system: true, count: 0 },
  { id: 'business', slug: 'business', name: 'Business Owners', description: 'Shop owners, club operators, and venture capitalists', icon: 'Briefcase', is_system: true, count: 0 },
  { id: 'ems', slug: 'ems', name: 'Medical & EMS', description: 'Emergency medical responders, trauma surgeons, and nurses', icon: 'HeartPulse', is_system: true, count: 0 },
  { id: 'government', slug: 'government', name: 'Government & DOJ', description: 'Judges, district attorneys, and municipal leaders', icon: 'Building2', is_system: true, count: 0 },
  { id: 'civilian', slug: 'civilian', name: 'Civilians', description: 'Everyday citizens keeping Los Santos running', icon: 'User', is_system: true, count: 0 },
  { id: 'deceased', slug: 'deceased', name: 'Deceased (CK)', description: 'Characters who have suffered permanent death in Los Santos', icon: 'Ghost', is_system: true, count: 0 },
  { id: 'inactive', slug: 'inactive', name: 'Inactive', description: 'Characters taking a hiatus or resting outside the state', icon: 'Clock', is_system: true, count: 0 },
];

export const FALLBACK_CHARACTERS: WikiCharacterDetail[] = [];

export function getFallbackSearchResults(query: string): WikiSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    return FALLBACK_CHARACTERS.map((c) => ({
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

  return FALLBACK_CHARACTERS.filter((c) => {
    const nameMatch = c.character.full_name.toLowerCase().includes(q);
    const aliasMatch = c.character.aliases.some((a) => a.toLowerCase().includes(q));
    const gangMatch = c.character.gang?.toLowerCase().includes(q);
    const jobMatch = c.character.occupation?.toLowerCase().includes(q);
    const bizMatch = c.character.business?.toLowerCase().includes(q);
    const summaryMatch = c.summary?.toLowerCase().includes(q);
    return nameMatch || aliasMatch || gangMatch || jobMatch || bizMatch || summaryMatch;
  }).map((c) => ({
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

export function getFallbackCharacterBySlug(slug: string): WikiCharacterDetail | null {
  const normSlug = slug.toLowerCase().trim();
  return FALLBACK_CHARACTERS.find((c) => c.slug.toLowerCase() === normSlug) || null;
}
