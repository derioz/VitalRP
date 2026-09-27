-- =========================================================================
-- Vital RP - Comprehensive Admin & Rules Management System Migration
-- Includes:
-- 1. Staff Members & Discord Role-Based Permissions
-- 2. Rules, Categories, Drafts, Snapshots, Change History & Audit Logs
-- 3. High-performance Indexes & Row Level Security Policies
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. STAFF MEMBERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_user_id TEXT UNIQUE NOT NULL,
  discord_username TEXT,
  discord_display_name TEXT,
  discord_avatar TEXT,
  last_known_roles JSONB DEFAULT '[]'::jsonb,
  first_admin_login TIMESTAMPTZ DEFAULT now(),
  last_admin_login TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_members_discord_id ON public.staff_members(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_active ON public.staff_members(active);

-- =========================================================================
-- 2. DISCORD ROLE MAPPINGS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.discord_role_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_role_id TEXT UNIQUE NOT NULL,
  discord_role_name TEXT NOT NULL,
  discord_role_color TEXT DEFAULT '#f97316',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discord_role_mappings_role_id ON public.discord_role_mappings(discord_role_id);
CREATE INDEX IF NOT EXISTS idx_discord_role_mappings_enabled ON public.discord_role_mappings(enabled);

-- =========================================================================
-- 3. DISCORD ROLE PERMISSIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.discord_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_mapping_id UUID NOT NULL REFERENCES public.discord_role_mappings(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_role_permission UNIQUE (role_mapping_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_discord_role_permissions_role_mapping ON public.discord_role_permissions(role_mapping_id);
CREATE INDEX IF NOT EXISTS idx_discord_role_permissions_permission ON public.discord_role_permissions(permission);

-- =========================================================================
-- 4. RULE CATEGORIES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rule_categories (
  id TEXT PRIMARY KEY, -- e.g. 'general', 'roleplay', 'criminal-rp'
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'ShieldAlert',
  sort_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rule_categories_sort_order ON public.rule_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_rule_categories_enabled ON public.rule_categories(enabled);

-- =========================================================================
-- 5. RULES TABLE (Published production rules)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rules (
  id TEXT PRIMARY KEY, -- e.g. 'server-age-restriction'
  category_id TEXT NOT NULL REFERENCES public.rule_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  rule_number INTEGER,
  title TEXT NOT NULL,
  short_title TEXT,
  short_description TEXT DEFAULT '',
  content TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  core_rule_number INTEGER,
  severity TEXT DEFAULT 'standard',
  callouts JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rules_category ON public.rules(category_id);
CREATE INDEX IF NOT EXISTS idx_rules_sort_order ON public.rules(sort_order);
CREATE INDEX IF NOT EXISTS idx_rules_rule_number ON public.rules(rule_number);
CREATE INDEX IF NOT EXISTS idx_rules_deleted_at ON public.rules(deleted_at);
CREATE INDEX IF NOT EXISTS idx_rules_enabled ON public.rules(enabled);
CREATE INDEX IF NOT EXISTS idx_rules_featured ON public.rules(featured);

-- =========================================================================
-- 6. RULES DRAFT TABLE (Unpublished modifications, staging area)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rules_draft (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.rule_categories(id) ON UPDATE CASCADE,
  rule_number INTEGER,
  title TEXT NOT NULL,
  short_title TEXT,
  short_description TEXT DEFAULT '',
  content TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  core_rule_number INTEGER,
  severity TEXT DEFAULT 'standard',
  callouts JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  action TEXT DEFAULT 'update', -- 'create', 'update', 'delete', 'reorder'
  created_by_discord_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rules_draft_rule_id ON public.rules_draft(rule_id);
CREATE INDEX IF NOT EXISTS idx_rules_draft_category_id ON public.rules_draft(category_id);

-- =========================================================================
-- 7. RULE VERSIONS TABLE (Complete snapshot for each published version)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rule_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_number INTEGER NOT NULL UNIQUE,
  snapshot JSONB NOT NULL, -- Full snapshot containing { categories: [...], rules: [...] }
  published_by_discord_id TEXT NOT NULL,
  published_by_display_name TEXT NOT NULL,
  publish_note TEXT DEFAULT '',
  changes_summary JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rule_versions_number ON public.rule_versions(version_number DESC);
CREATE INDEX IF NOT EXISTS idx_rule_versions_published_at ON public.rule_versions(published_at DESC);

-- =========================================================================
-- 8. RULE CHANGE HISTORY TABLE (Granular audit log of individual edits)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rule_change_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'restored', 'published', 'reordered'
  before_data JSONB,
  after_data JSONB,
  changed_by_discord_id TEXT NOT NULL,
  changed_by_display_name TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rule_change_rule_id ON public.rule_change_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_change_changed_at ON public.rule_change_history(changed_at DESC);

-- =========================================================================
-- 9. AUDIT LOGS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  details TEXT,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_discord_user ON public.audit_logs(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =========================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_role_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules_draft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read enabled categories
DROP POLICY IF EXISTS "Public can view active rule categories" ON public.rule_categories;
CREATE POLICY "Public can view active rule categories"
  ON public.rule_categories FOR SELECT
  USING (enabled = true);

-- Public can read active, non-deleted rules
DROP POLICY IF EXISTS "Public can view published rules" ON public.rules;
CREATE POLICY "Public can view published rules"
  ON public.rules FOR SELECT
  USING (deleted_at IS NULL AND enabled = true);

-- Public can read published versions
DROP POLICY IF EXISTS "Public can view rule versions" ON public.rule_versions;
CREATE POLICY "Public can view rule versions"
  ON public.rule_versions FOR SELECT
  USING (true);

-- =========================================================================
-- 11. DEFAULT DISCORD ROLE MAPPINGS SEED
-- =========================================================================
-- Insert standard Vital RP staff roles
INSERT INTO public.discord_role_mappings (id, discord_role_id, discord_role_name, discord_role_color, enabled)
VALUES
  ('a1000000-0000-0000-0000-000000000001', '733090996660863056', 'Senior Administrator', '#ef4444', true),
  ('a1000000-0000-0000-0000-000000000002', '733091115577901158', 'Administrator', '#f97316', true),
  ('a1000000-0000-0000-0000-000000000003', '733091376832708689', 'Moderator', '#3b82f6', true),
  ('a1000000-0000-0000-0000-000000000004', '733091380540473384', 'Support Staff', '#10b981', true)
ON CONFLICT (discord_role_id) DO UPDATE SET
  discord_role_name = EXCLUDED.discord_role_name,
  discord_role_color = EXCLUDED.discord_role_color,
  enabled = EXCLUDED.enabled;

-- Assign permissions to Senior Administrator (All permissions)
INSERT INTO public.discord_role_permissions (role_mapping_id, permission)
SELECT 'a1000000-0000-0000-0000-000000000001', unnest(ARRAY[
  'admin.access', 'rules.view', 'rules.edit', 'rules.publish', 'rules.history',
  'staff.view', 'staff.manage', 'permissions.manage', 'audit.view', 'settings.manage'
])
ON CONFLICT (role_mapping_id, permission) DO NOTHING;

-- Assign permissions to Administrator
INSERT INTO public.discord_role_permissions (role_mapping_id, permission)
SELECT 'a1000000-0000-0000-0000-000000000002', unnest(ARRAY[
  'admin.access', 'rules.view', 'rules.edit', 'rules.publish', 'rules.history',
  'staff.view', 'audit.view', 'settings.manage'
])
ON CONFLICT (role_mapping_id, permission) DO NOTHING;

-- Assign permissions to Moderator
INSERT INTO public.discord_role_permissions (role_mapping_id, permission)
SELECT 'a1000000-0000-0000-0000-000000000003', unnest(ARRAY[
  'admin.access', 'rules.view', 'rules.history'
])
ON CONFLICT (role_mapping_id, permission) DO NOTHING;

-- Assign permissions to Support Staff
INSERT INTO public.discord_role_permissions (role_mapping_id, permission)
SELECT 'a1000000-0000-0000-0000-000000000004', unnest(ARRAY[
  'admin.access', 'rules.view'
])
ON CONFLICT (role_mapping_id, permission) DO NOTHING;
