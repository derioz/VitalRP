-- ==============================================================================
-- Vital RP Wiki System Migration
-- Supports Characters, Organizations, Gangs, Backlink Graph, Mentions, Revisions,
-- FiveManage Media, and Role-Based Permissions
-- ==============================================================================

-- 1. WIKI PAGES TABLE (Generic entity foundation for characters, gangs, businesses, etc.)
CREATE TABLE IF NOT EXISTS public.wiki_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'character', -- 'character', 'gang', 'business', 'government', etc.
  summary TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'deceased', 'archived'
  is_archived BOOLEAN DEFAULT false,
  page_views INTEGER DEFAULT 0,
  created_by_discord_id TEXT NOT NULL,
  updated_by_discord_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_slug ON public.wiki_pages(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_entity_type ON public.wiki_pages(entity_type);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_status ON public.wiki_pages(status);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_created_by ON public.wiki_pages(created_by_discord_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_updated_at ON public.wiki_pages(updated_at DESC);

-- 2. WIKI CHARACTERS TABLE (Specific structured character profile data)
CREATE TABLE IF NOT EXISTS public.wiki_characters (
  page_id UUID PRIMARY KEY REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  avatar_url TEXT DEFAULT '',
  avatar_crop JSONB DEFAULT NULL, -- { x: 0, y: 0, zoom: 1 }
  date_of_birth TEXT DEFAULT '',
  pronouns TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  nationality TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  employer TEXT DEFAULT '',
  gang TEXT DEFAULT '',
  business TEXT DEFAULT '',
  residence TEXT DEFAULT '',
  relationship_status TEXT DEFAULT '',
  player_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_characters_full_name ON public.wiki_characters(full_name);
CREATE INDEX IF NOT EXISTS idx_wiki_characters_occupation ON public.wiki_characters(occupation);
CREATE INDEX IF NOT EXISTS idx_wiki_characters_gang ON public.wiki_characters(gang);

-- 3. WIKI SECTIONS TABLE (Modular rich-text sections per page)
CREATE TABLE IF NOT EXISTS public.wiki_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL, -- 'overview', 'biography', 'criminal_history', 'assets', 'trivia', or custom
  title TEXT NOT NULL,
  content_html TEXT DEFAULT '',
  content_json JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_page_section UNIQUE (page_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_wiki_sections_page ON public.wiki_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_sections_sort ON public.wiki_sections(page_id, sort_order);

-- 4. WIKI LINKS GRAPH TABLE (Internal link graph for @ mentions and backlinks)
CREATE TABLE IF NOT EXISTS public.wiki_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  section_key TEXT DEFAULT 'overview',
  context_snippet TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_wiki_link UNIQUE (source_page_id, target_page_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_wiki_links_source ON public.wiki_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_links_target ON public.wiki_links(target_page_id);

-- 5. WIKI RELATIONSHIPS TABLE (Structured relationships between characters)
CREATE TABLE IF NOT EXISTS public.wiki_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'Partner', 'Friend', 'Family', 'Enemy', 'Coworker', etc.
  description TEXT DEFAULT '',
  is_confirmed BOOLEAN DEFAULT false, -- For future mutual confirmation feature
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_relationships_page ON public.wiki_relationships(page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_relationships_target ON public.wiki_relationships(target_page_id);

-- 6. WIKI CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.wiki_categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'Users',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. WIKI PAGE CATEGORIES JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.wiki_page_categories (
  page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES public.wiki_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_page_categories_page ON public.wiki_page_categories(page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_page_categories_category ON public.wiki_page_categories(category_id);

-- 8. WIKI IMAGES TABLE (FiveManage metadata & association)
CREATE TABLE IF NOT EXISTS public.wiki_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES public.wiki_pages(id) ON DELETE SET NULL,
  fivemanage_id TEXT DEFAULT '',
  url TEXT NOT NULL,
  original_name TEXT DEFAULT '',
  mime_type TEXT DEFAULT 'image/webp',
  size_bytes INTEGER DEFAULT 0,
  caption TEXT DEFAULT '',
  alt_text TEXT DEFAULT '',
  date_taken TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  uploaded_by_discord_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_images_page ON public.wiki_images(page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_images_uploader ON public.wiki_images(uploaded_by_discord_id);

-- 9. WIKI REVISIONS TABLE (Historical snapshots and audit trail)
CREATE TABLE IF NOT EXISTS public.wiki_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  snapshot_data JSONB NOT NULL, -- Full snapshot of character, sections, categories, and relationships
  editor_discord_id TEXT NOT NULL,
  editor_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_revisions_page ON public.wiki_revisions(page_id, revision_number DESC);

-- 10. WIKI SLUG REDIRECTS TABLE (Maintains URL history on renaming)
CREATE TABLE IF NOT EXISTS public.wiki_slug_redirects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  old_slug TEXT UNIQUE NOT NULL,
  new_slug TEXT NOT NULL,
  page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_slug_redirects_old ON public.wiki_slug_redirects(old_slug);

-- 11. WIKI DRAFTS TABLE (Safe autosave drafts)
CREATE TABLE IF NOT EXISTS public.wiki_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  user_discord_id TEXT NOT NULL,
  draft_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_wiki_draft UNIQUE (page_id, user_discord_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_drafts_user ON public.wiki_drafts(user_discord_id);

-- Enable RLS on all tables
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_page_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_slug_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_drafts ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can read published wiki pages and public entities)
CREATE POLICY "Public read wiki_pages" ON public.wiki_pages FOR SELECT USING (is_archived = false);
CREATE POLICY "Public read wiki_characters" ON public.wiki_characters FOR SELECT USING (true);
CREATE POLICY "Public read wiki_sections" ON public.wiki_sections FOR SELECT USING (is_hidden = false);
CREATE POLICY "Public read wiki_links" ON public.wiki_links FOR SELECT USING (true);
CREATE POLICY "Public read wiki_relationships" ON public.wiki_relationships FOR SELECT USING (true);
CREATE POLICY "Public read wiki_categories" ON public.wiki_categories FOR SELECT USING (true);
CREATE POLICY "Public read wiki_page_categories" ON public.wiki_page_categories FOR SELECT USING (true);
CREATE POLICY "Public read wiki_images" ON public.wiki_images FOR SELECT USING (true);
CREATE POLICY "Public read wiki_revisions" ON public.wiki_revisions FOR SELECT USING (true);
CREATE POLICY "Public read wiki_slug_redirects" ON public.wiki_slug_redirects FOR SELECT USING (true);
-- Drafts are strictly private to the authenticated creator
CREATE POLICY "Owner read wiki_drafts" ON public.wiki_drafts FOR SELECT USING (auth.uid()::text = user_discord_id);

-- Seed System Default Categories
INSERT INTO public.wiki_categories (id, slug, name, description, icon, is_system)
VALUES
  ('characters', 'characters', 'Characters', 'All active, inactive, and historic characters in Los Santos', 'Users', true),
  ('police', 'police', 'Police & Law Enforcement', 'LSPD, BCSO, SASP and state law enforcement personnel', 'Shield', true),
  ('ems', 'ems', 'Medical & EMS', 'Emergency Medical Services, doctors, and healthcare professionals', 'HeartPulse', true),
  ('government', 'government', 'Government & DOJ', 'Department of Justice, judges, lawyers, and public officials', 'Building2', true),
  ('criminal', 'criminal', 'Criminals & Underworld', 'Known criminals, heisters, and underground operatives', 'Skull', true),
  ('gang', 'gang', 'Gangs & Factions', 'Official street gangs, mafias, motorcycle clubs, and syndicates', 'Flame', true),
  ('business', 'business', 'Business Owners & Executives', 'Entrepreneurs, storefront owners, and corporate executives', 'Briefcase', true),
  ('civilian', 'civilian', 'Civilians', 'Law-abiding citizens, workers, and everyday residents of Los Santos', 'User', true),
  ('deceased', 'deceased', 'Deceased', 'Characters who have met permanent death (CK)', 'Ghost', true),
  ('inactive', 'inactive', 'Inactive', 'Characters currently dormant or away from Los Santos', 'Clock', true)
ON CONFLICT (id) DO NOTHING;
