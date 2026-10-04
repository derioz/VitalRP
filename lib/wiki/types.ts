export type CharacterStatus = 'active' | 'inactive' | 'deceased' | 'archived';

export type WikiEntityType = 'character' | 'gang' | 'business' | 'government' | 'organization' | 'location' | 'event';

export interface WikiPage {
  id: string;
  slug: string;
  title: string;
  entity_type: WikiEntityType;
  summary: string;
  status: CharacterStatus;
  is_archived: boolean;
  page_views: number;
  created_by_discord_id: string;
  created_by_user_id?: string;
  updated_by_discord_id?: string;
  is_draft?: boolean;
  created_at: string;
  updated_at: string;
}

export interface WikiCharacter {
  page_id: string;
  full_name: string;
  aliases: string[];
  avatar_url: string;
  avatar_crop?: { x: number; y: number; zoom: number } | null;
  date_of_birth?: string;
  pronouns?: string;
  gender?: string;
  nationality?: string;
  occupation?: string;
  employer?: string;
  gang?: string;
  business?: string;
  residence?: string;
  relationship_status?: string;
  player_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WikiSection {
  id?: string;
  page_id?: string;
  section_key: string;
  title: string;
  content_html: string;
  content_json?: any;
  sort_order: number;
  is_hidden?: boolean;
}

export interface WikiRelationshipTarget {
  id: string;
  slug: string;
  full_name: string;
  avatar_url?: string;
  status?: CharacterStatus;
  gang?: string;
  occupation?: string;
}

export interface WikiRelationship {
  id?: string;
  page_id?: string;
  target_page_id: string;
  relationship_type: string;
  description: string;
  is_confirmed?: boolean;
  target?: WikiRelationshipTarget;
}

export interface WikiCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  is_system?: boolean;
  count?: number;
}

export interface WikiImage {
  id?: string;
  page_id?: string;
  fivemanage_id?: string;
  url: string;
  original_name?: string;
  mime_type?: string;
  size_bytes?: number;
  caption?: string;
  alt_text?: string;
  date_taken?: string;
  sort_order?: number;
  uploaded_by_discord_id?: string;
  created_at?: string;
}

export interface WikiRevision {
  id: string;
  page_id: string;
  revision_number: number;
  title: string;
  summary: string;
  snapshot_data: any;
  editor_discord_id: string;
  editor_name: string;
  created_at: string;
}

export interface WikiBacklink {
  id: string;
  source_page_id: string;
  target_page_id: string;
  section_key: string;
  context_snippet: string;
  created_at: string;
  source?: {
    id: string;
    slug: string;
    title: string;
    full_name: string;
    avatar_url: string;
    status: CharacterStatus;
    gang?: string;
    occupation?: string;
  };
}

export interface WikiCharacterDetail extends WikiPage {
  character: WikiCharacter;
  sections: WikiSection[];
  categories: WikiCategory[];
  relationships: WikiRelationship[];
  gallery: WikiImage[];
  backlinks?: WikiBacklink[];
  related_characters?: WikiRelationshipTarget[];
}

export interface WikiSearchResult {
  id: string;
  slug: string;
  title: string;
  full_name: string;
  aliases: string[];
  avatar_url: string;
  status: CharacterStatus;
  occupation?: string;
  gang?: string;
  business?: string;
  summary?: string;
  matched_field?: string;
  categories?: string[];
}

export interface WikiDirectoryFilter {
  query?: string;
  status?: string;
  category?: string;
  letter?: string;
  sort?: 'name_asc' | 'name_desc' | 'updated_desc' | 'popular';
  page?: number;
  limit?: number;
}

export const DEFAULT_CHARACTER_SECTIONS = [
  { section_key: 'overview', title: 'Overview', defaultOpen: true },
  { section_key: 'biography', title: 'Biography & History', defaultOpen: true },
  { section_key: 'criminal_history', title: 'Criminal History', defaultOpen: false },
  { section_key: 'employment', title: 'Employment & Businesses', defaultOpen: false },
  { section_key: 'story_arcs', title: 'Major Events & Story Arcs', defaultOpen: false },
  { section_key: 'assets', title: 'Assets & Property', defaultOpen: false },
  { section_key: 'trivia', title: 'Trivia & Facts', defaultOpen: false },
] as const;

export const RELATIONSHIP_TYPES = [
  'Partner',
  'Family',
  'Close Friend',
  'Friend',
  'Associate',
  'Gang Member',
  'Coworker',
  'Enemy',
  'Former Friend',
  'Former Partner',
  'Rival',
] as const;
