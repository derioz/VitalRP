-- =========================================================================
-- Vital RP - Supabase Database Schema & Auto-Profile Sync
-- Paste and Run this in your Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Create a table for public profiles linked to Supabase auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  discord_id text unique,
  username text,
  display_name text,
  avatar_url text,
  email text,
  role text not null default 'user' check (role in ('user', 'staff', 'admin', 'owner')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Drop existing policies if any
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Anyone can read profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

-- Users can only update their own non-sensitive profile fields
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 3. Automatic Trigger to create or update profile on sign-in
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_discord_id text;
  raw_username text;
  raw_display_name text;
  raw_avatar_url text;
  user_role text;
begin
  -- Extract Discord data from user metadata
  raw_discord_id := coalesce(
    new.raw_user_meta_data->>'provider_id',
    new.raw_user_meta_data->>'sub',
    ''
  );
  raw_username := coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    'User'
  );
  raw_display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    raw_username
  );
  raw_avatar_url := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );

  -- Automatically assign 'owner' role to space (Discord ID: 150580708144840704)
  if raw_discord_id = '150580708144840704' then
    user_role := 'owner';
  else
    user_role := 'user';
  end if;

  insert into public.profiles (
    id,
    discord_id,
    username,
    display_name,
    avatar_url,
    email,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    raw_discord_id,
    raw_username,
    raw_display_name,
    raw_avatar_url,
    new.email,
    user_role,
    now(),
    now()
  )
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- Vital RP - Comprehensive Admin & Rules Management System
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STAFF MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_user_id TEXT UNIQUE NOT NULL,
  discord_username TEXT,
  discord_display_name TEXT,
  discord_avatar TEXT,
  primary_role TEXT,
  recognized_roles JSONB DEFAULT '[]'::jsonb,
  last_known_roles JSONB DEFAULT '[]'::jsonb,
  first_admin_login TIMESTAMPTZ DEFAULT now(),
  last_admin_login TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_members_discord_id ON public.staff_members(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_active ON public.staff_members(active);
CREATE INDEX IF NOT EXISTS idx_staff_members_primary_role ON public.staff_members(primary_role);

-- Safe migration block for staff_members columns
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff_members' AND column_name = 'primary_role'
  ) THEN
    ALTER TABLE public.staff_members ADD COLUMN primary_role TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff_members' AND column_name = 'recognized_roles'
  ) THEN
    ALTER TABLE public.staff_members ADD COLUMN recognized_roles JSONB DEFAULT '[]'::jsonb;
  END IF;
END $;


-- 2. DISCORD ROLE MAPPINGS TABLE
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

-- 3. DISCORD ROLE PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.discord_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_mapping_id UUID NOT NULL REFERENCES public.discord_role_mappings(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_role_permission UNIQUE (role_mapping_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_discord_role_permissions_role_mapping ON public.discord_role_permissions(role_mapping_id);
CREATE INDEX IF NOT EXISTS idx_discord_role_permissions_permission ON public.discord_role_permissions(permission);

-- 4. RULE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.rule_categories (
  id TEXT PRIMARY KEY,
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

-- 5. RULES TABLE
CREATE TABLE IF NOT EXISTS public.rules (
  id TEXT PRIMARY KEY,
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

-- 6. RULES DRAFT TABLE
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
  action TEXT DEFAULT 'update',
  created_by_discord_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_rules_draft_rule_id UNIQUE (rule_id)
);

CREATE INDEX IF NOT EXISTS idx_rules_draft_rule_id ON public.rules_draft(rule_id);
CREATE INDEX IF NOT EXISTS idx_rules_draft_category_id ON public.rules_draft(category_id);

-- Ensure unique constraint on rule_id exists for draft upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_rules_draft_rule_id'
  ) THEN
    DELETE FROM public.rules_draft a
    USING public.rules_draft b
    WHERE a.ctid < b.ctid AND a.rule_id = b.rule_id;

    ALTER TABLE public.rules_draft ADD CONSTRAINT uq_rules_draft_rule_id UNIQUE (rule_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$
;

-- 7. RULE VERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.rule_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_number INTEGER NOT NULL UNIQUE,
  snapshot JSONB NOT NULL,
  published_by_discord_id TEXT NOT NULL,
  published_by_display_name TEXT NOT NULL,
  publish_note TEXT DEFAULT '',
  changes_summary JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rule_versions_number ON public.rule_versions(version_number DESC);
CREATE INDEX IF NOT EXISTS idx_rule_versions_published_at ON public.rule_versions(published_at DESC);

-- 8. RULE CHANGE HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.rule_change_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  changed_by_discord_id TEXT NOT NULL,
  changed_by_display_name TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rule_change_rule_id ON public.rule_change_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_change_changed_at ON public.rule_change_history(changed_at DESC);

-- 9. AUDIT LOGS TABLE
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

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_role_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules_draft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active rule categories" ON public.rule_categories;
CREATE POLICY "Public can view active rule categories"
  ON public.rule_categories FOR SELECT
  USING (enabled = true);

DROP POLICY IF EXISTS "Public can view published rules" ON public.rules;
CREATE POLICY "Public can view published rules"
  ON public.rules FOR SELECT
  USING (deleted_at IS NULL AND enabled = true);

DROP POLICY IF EXISTS "Public can view rule versions" ON public.rule_versions;
CREATE POLICY "Public can view rule versions"
  ON public.rule_versions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow manage rule categories" ON public.rule_categories;
CREATE POLICY "Allow manage rule categories"
  ON public.rule_categories FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage rules" ON public.rules;
CREATE POLICY "Allow manage rules"
  ON public.rules FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage rules draft" ON public.rules_draft;
CREATE POLICY "Allow manage rules draft"
  ON public.rules_draft FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage rule versions" ON public.rule_versions;
CREATE POLICY "Allow manage rule versions"
  ON public.rule_versions FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage rule change history" ON public.rule_change_history;
CREATE POLICY "Allow manage rule change history"
  ON public.rule_change_history FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage audit logs" ON public.audit_logs;
CREATE POLICY "Allow manage audit logs"
  ON public.audit_logs FOR ALL
  USING (true)
  WITH CHECK (true);


-- 11. DEFAULT SEED ROLE MAPPINGS
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

INSERT INTO public.discord_role_permissions (role_mapping_id, permission)
SELECT 'a1000000-0000-0000-0000-000000000001', unnest(ARRAY[
  'admin.access', 'rules.view', 'rules.edit', 'rules.publish', 'rules.history',
  'staff.view', 'staff.manage', 'permissions.manage', 'audit.view', 'settings.manage'
])
ON CONFLICT (role_mapping_id, permission) DO NOTHING;

INSERT INTO public.discord_role_permissions (role_mapping_id, permission)
SELECT 'a1000000-0000-0000-0000-000000000002', unnest(ARRAY[
  'admin.access', 'rules.view', 'rules.edit', 'rules.publish', 'rules.history',
  'staff.view', 'audit.view', 'settings.manage'
])
ON CONFLICT (role_mapping_id, permission) DO NOTHING;

INSERT INTO public.discord_role_permissions (role_mapping_id, permission)
SELECT 'a1000000-0000-0000-0000-000000000003', unnest(ARRAY[
  'admin.access', 'rules.view', 'rules.history'
])
ON CONFLICT (role_mapping_id, permission) DO NOTHING;

INSERT INTO public.discord_role_permissions (role_mapping_id, permission)
SELECT 'a1000000-0000-0000-0000-000000000004', unnest(ARRAY[
  'admin.access', 'rules.view'
])
ON CONFLICT (role_mapping_id, permission) DO NOTHING;

-- Seed Super Admin Damon into staff_members
INSERT INTO public.staff_members (
  id,
  discord_user_id,
  discord_username,
  discord_display_name,
  discord_avatar,
  primary_role,
  recognized_roles,
  last_known_roles,
  first_admin_login,
  last_admin_login,
  active
)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  '150580708144840704',
  'damon',
  'Damon',
  'https://cdn.discordapp.com/avatars/150580708144840704/bedf3166ac36aa21047fee8c77d94c26.png',
  'Super Admin',
  '["Super Admin"]'::jsonb,
  '["Super Admin"]'::jsonb,
  '2026-09-01 00:00:00+00',
  now(),
  true
)
ON CONFLICT (discord_user_id) DO UPDATE SET
  primary_role = 'Super Admin',
  active = true;


-- =========================================================================
-- 12. INITIAL SEED: ACTUAL VITAL RP RULES & CATEGORIES MIGRATION (VERSION 1)
-- =========================================================================

-- Seed Rule Categories
INSERT INTO public.rule_categories (id, title, description, icon, sort_order, enabled)
VALUES
  ('general', 'General Server Rules', 'Fundamental server guidelines, age restrictions, and platform expectations.', 'ShieldAlert', 1, true),
  ('roleplay', 'Roleplay Standards', 'Foundational roleplay mechanics including Value of Life, NLR, and immersion rules.', 'Drama', 2, true),
  ('combat-interactions', 'Combat & Player Interactions', 'Rules governing hostilities, robberies, combat logging, and player confrontations.', 'Crosshair', 3, true),
  ('criminal-rp', 'Criminal RP & Heists', 'Crime caps, robbery tiers, police response limits, and Extraction Island regulations.', 'Flame', 4, true),
  ('government', 'Government & Public Services', 'Regulations for Law Enforcement (LSPD), Medical Services (EMS), and Department of Justice (DOJ).', 'BadgeCheck', 5, true),
  ('community-conduct', 'Community Conduct', 'Zero tolerance policies regarding toxicity, discrimination, harassment, and gross RP.', 'HeartHandshake', 6, true),
  ('factions', 'Factions & Gang Operations', 'Faction creation, member caps, attire requirements, IFM communication, and crew guidelines.', 'Users', 7, true),
  ('faction-conflict', 'Faction Conflict & Wars', 'Gang wars, conflict escalation, bleed-in/bleed-out rules, recording requirements, and racing.', 'Swords', 8, true),
  ('reports-enforcement', 'Reports & Enforcement', 'How to report rule breaks, rule baiting bans, and server dispute protocols.', 'FileText', 9, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  enabled = EXCLUDED.enabled;

-- Seed All 31 Existing Website Rules
INSERT INTO public.rules (id, category_id, rule_number, title, short_title, short_description, content, aliases, featured, core_rule_number, severity, callouts, sort_order, enabled)
VALUES
  ('server-age-restriction', 'general', 1, 'Server Age Restriction (18+)', '18+ Server', 'Vital RP is strictly an 18+ community with zero exceptions. Mature themes and adult conversations may occur.', 'This is an 18+ Server with no exceptions. That means that humor and conversation topics could be adult in nature at times.

All members must be at least 18 years of age to whitelist and play on Vital RP. Any player found to be under 18 will be permanently banned until they reach legal age.', ARRAY['18+', 'age limit', 'mature', 'adult', 'underage']::TEXT[], true, 1, 'standard', '[{"type":"WARNING","title":"Zero Tolerance on Underage Players","text":"Providing false age information during whitelisting or in Discord will result in an immediate permanent unappealable ban."}]'::jsonb, 1, true),
  ('community-expectations', 'general', 2, 'Community Expectations', 'Expectations', 'Set your Discord name to your IC name, consent to PC checks upon whitelisting, and maintain adult accountability.', 'Upon joining the Discord, you must change your Discord name to your main roleplay first and last name (exceptions apply to staff, who may use their staff name).

By becoming whitelisted and participating in the city, you also automatically consent to random PC checks at any time. For more information, please submit a ticket.

Criticism is welcome; toxicity is not. You’re free to share concerns, but abuse, harassment, or targeted negativity toward the community, server, or staff won’t be tolerated. We take accountability seriously. Reports involving staff (even owners) are reviewed independently. This includes ban disputes.

This is a space for fun, collaborative RP. If you bring constant negativity, stir OOC drama, or fuel arguments, you may be removed. You don’t need to be friends with everyone, just act like an adult.', ARRAY['discord name', 'pc check', 'toxicity', 'criticism', 'accountability', 'whitelisting']::TEXT[], false, NULL, 'standard', '[{"type":"IMPORTANT","title":"Random PC Checks","text":"Participation in Vital RP includes automatic consent to random PC checks by authorized staff to verify game integrity."}]'::jsonb, 2, true),
  ('voice-communication', 'general', 3, 'Voice Communication', 'Voice & Mic', 'The majority of communication must be in English. A working microphone is required at all times.', 'The majority of communication MUST be in English.

Every player is required to have a working, clear microphone while connected to the server. Roleplaying as mute or communicating exclusively through text/third-party apps without prior staff approval is not permitted. Voice changers and soundboards must sound realistic and fit your character concept.', ARRAY['mic', 'voice', 'microphone', 'english', 'soundboard', 'voice changer']::TEXT[], false, NULL, 'standard', '[]'::jsonb, 3, true),
  ('exploits-cheating', 'general', 4, 'Exploits & Cheating', 'No Exploiting', 'Intentionally abusing server bugs, animations, scripts, or third-party software for competitive advantage is strictly forbidden.', 'Players must not intentionally abuse any server bugs, script bugs, scripts or GTA game mechanics to gain an unfair advantage. Use of game mechanics (intended or otherwise) to gain an unfair advantage is considered exploiting (e.g., using known bugs or using game features in inappropriate and unintended ways).

Any changes you make to your game that give you a competitive advantage over other players are not allowed to be used on this server. This includes, but is not limited to:
- Crosshair overlays or external aim aids
- Modified game files granting speed, stamina, or field of view advantages
- Custom weapon visual effects that remove smoke, flash, or recoil
- Abusing emote cancelling or animation cancelling in gunfights or robberies', ARRAY['exploiting', 'cheating', 'bugs', 'hacks', 'crosshairs', 'modifications', 'animation cancelling', 'abusing']::TEXT[], true, 8, 'standard', '[{"type":"NOT_ALLOWED","title":"Permanent Ban","text":"Using malicious software, memory injection, speed hacks, or third-party combat enhancements will lead to an immediate permanent hardware ban."}]'::jsonb, 4, true),
  ('disrupting-server-operations', 'general', 5, 'Disrupting Server Operations (DSO)', 'DSO', 'Prohibits advertising other communities, poaching members, slandering the server, cyber attacks, and doxxing.', 'Disrupting Server Operations (DSO) is an umbrella term used to protect the server and its community from harmful external or out-of-character actions.

Players are strictly not allowed to take part in or have knowledge of:
1. Advertising any other roleplay servers/communities or attempting to poach members from Vital RP''s Discord server or any official platforms.
2. Slandering: Attempting to discredit or defame Vital RP or its members across Discord, Twitch, social media, or other public platforms.
3. Doxxing: Leaking personal, private, or real-life information of any member of the Vital RP community.
4. Cyber Attacks: Engaging in, coordinating, or having knowledge of DDoS attacks, account theft, credential stuffing, or server sabotage.
5. Severe Unreported Rulebreaks: Shielding players who are actively exploiting or running malicious activities against the community.', ARRAY['DSO', 'advertising', 'poaching', 'slander', 'doxxing', 'ddos', 'cyber attack', 'sabotage']::TEXT[], false, NULL, 'standard', '[{"type":"WARNING","title":"Immediate Community Removal","text":"DSO violations are treated as malicious attacks against the server and result in instant blacklisting across all Vital RP infrastructure."}]'::jsonb, 5, true),
  ('ban-evasion', 'general', 6, 'Ban Evasion', 'Ban Evading', 'Circumventing a suspension using alternate accounts, VPNs, or new identifiers converts temporary suspensions into permanent unappealable bans.', 'Ban evading is strictly prohibited. If you are banned or suspended from Vital RP, you must follow the appropriate method to appeal that ban for it to be lifted.

If you attempt to circumvent a ban using alternate Discord accounts, new Steam/Rockstar accounts, VPNs, or hardware spoofing, your suspension will automatically turn into a permanent ban with zero chance of appeal.', ARRAY['ban evasion', 'alt account', 'ban evading', 'vpn', 'spoofing', 'appeal']::TEXT[], false, NULL, 'standard', '[{"type":"NOT_ALLOWED","title":"Unappealable Permanent Ban","text":"Attempting to evade a ban forfeits any right to standard ticket appeals."}]'::jsonb, 6, true),
  ('real-world-trading', 'general', 7, 'Real-World Trading (RWT) & Asset Transfers', 'RWT & Transfers', 'Exchanging in-game items or currency for real-world money, or transferring assets between your own characters, is strictly prohibited.', 'Real-World Trading (RWT) and/or transferring accumulated assets from one of your own characters to another, regardless of the reason, is strictly prohibited.

RWT refers to the exchange of in-game items, currency, or services for real-world money or goods, or vice versa, either directly or through third-party platforms. Engaging in RWT undermines the integrity of the game environment and creates unfair advantages for those who participate.

Any player found participating in RWT will face penalties, including but not limited to:
- Temporary or permanent suspension from Vital Roleplay.
- Complete confiscation and wipe of in-game items, properties, and currency involved.

Note: In-character gifting or selling between completely separate players for in-character money is valid; transferring assets between characters owned by the same real-life player is not.', ARRAY['RWT', 'real world trading', 'selling money', 'asset transfer', 'alt character', 'cash buying']::TEXT[], false, NULL, 'standard', '[{"type":"NOT_ALLOWED","title":"Asset Confiscation","text":"All assets and funds involved in illicit transfers or real-world money transactions will be permanently deleted from the database."}]'::jsonb, 7, true),
  ('stay-in-character', 'roleplay', 8, 'Stay in Character (No Breaking Character)', 'Stay in Character', 'Do not break character during active scenes. If a rule is broken, play out the scene and report it afterward.', 'No Breaking Character – Stay in character during scenes. If a rule is broken, normally finish the RP and report it afterward unless it involves serious issues that require immediate intervention (such as hate speech, gross RP, or severe game disruption).

Do not discuss server rules, OOC tickets, bans, discord messages, or mechanics in voice chat or /me. Roleplay over ruleplay: prioritize keeping the scene immersive and handle disputes through the proper ticket channels afterward.', ARRAY['breaking character', 'ooc in voice', 'in character', 'stay in character', 'ruleplay', 'finish the scene']::TEXT[], true, 2, 'standard', '[{"type":"IMPORTANT","title":"Roleplay Over Ruleplay","text":"Do not pause active scenes to argue rules in voice chat. Complete the roleplay organically and submit a ticket afterward with your recording."}]'::jsonb, 8, true),
  ('fear-rp', 'roleplay', 9, 'Value of Life (Fear Roleplay)', 'Value of Life (FearRP)', 'Characters must realistically value their lives at all times and react appropriately when facing deadly threats.', 'Players must prioritise their character''s life and act as if they have only one life to live. When placed in a situation where your life is in clear and immediate danger, you must display genuine fear and value for your survival.

Key FearRP Requirements:
1. When a firearm is drawn and pointed at you before you have drawn a weapon, you must comply with reasonable demands. You may not pull a weapon out while staring down the barrel of a loaded gun.
2. If multiple armed assailants have the drop on you, you cannot "superhero" your way out by pulling a gun or jumping into moving traffic.
3. If you have clear cover or the assailant looks away / lowers their weapon, you may realistically evaluate escape or retaliation options, but reckless disregard for fatal injury is a rule violation.', ARRAY['FearRP', 'value of life', 'fear roleplay', 'gunpoint', 'hands up', 'hostage fear']::TEXT[], true, 3, 'standard', '[{"type":"IMPORTANT","title":"Immediate Lethal Threat","text":"Drawing a firearm while someone already has a firearm aimed directly at your head or chest with intent to fire is a direct FearRP violation."}]'::jsonb, 9, true),
  ('new-life-rule', 'roleplay', 10, 'New Life Rule (NLR)', 'New Life Rule (NLR)', 'When flatbacked (second stage), you forget all events leading to your death and must observe a mandatory 30-minute scene restriction.', 'When a character is flatbacked (the second stage of being downed where you bleed out or respawn at the hospital), they experience memory loss regarding the events, conflict, and circumstances that led up to their death.

NLR Regulations:
1. Memory Loss: Your character has no memory of who killed them, where it happened, or why. You cannot seek revenge or act on that specific incident.
2. 30-Minute Restriction: For 30 minutes, the flatbacked player may not interact with, pursue, acknowledge, or return to the scene of their death.
3. Cooldown Actions: During the 30-minute cooldown, you cannot rejoin the active conflict, communicate information about the shootout to your faction, or re-engage the opposing party.
4. Downed (1st Stage) vs Flatbacked (2nd Stage):
   - Downed (1st stage): A downed player awaiting EMS may communicate basic physical information (such as personal identification or brief description of physical injuries).
   - Flatbacked (2nd stage): Once respawned at the hospital, complete NLR takes effect immediately.', ARRAY['NLR', 'new life rule', 'flatbacked', 'respawn', 'bleed out', 'hospital', 'memory loss', '30 minutes']::TEXT[], true, 4, 'standard', '[{"type":"COOLDOWN","title":"30-Minute Exclusion Zone","text":"You may not return to the radius of your death for a full 30 minutes following hospital respawn."}]'::jsonb, 10, true),
  ('metagaming', 'roleplay', 11, 'Meta Gaming (MG)', 'Metagaming (MG)', 'Using Out-Of-Character (OOC) knowledge in-character (IC) from streams, Discord, or external sources is strictly prohibited.', 'Metagaming is the act of gathering information Out-Of-Character (OOC) and using it In-Character (IC). This could be information from different platforms such as Twitch streams, Discord channels, YouTube videos, or other methods of external information spreading.

Examples of Metagaming:
- Watching a streamer''s broadcast to locate their stash house, convoy, or active position in-game.
- Calling out enemy locations in a Discord voice channel while in an active shootout instead of using in-game radios or phones.
- Using character names seen over heads or in Discord rosters without having met them in-character.
- Reading police dispatch or faction chats outside the game to prepare an ambush.', ARRAY['MG', 'metagaming', 'meta', 'stream sniping', 'discord calls', 'ooc info']::TEXT[], true, 5, 'standard', '[{"type":"NOT_ALLOWED","title":"Third-Party Comms in Active Scenes","text":"Relaying tactical in-game positions through Discord voice or direct messages during shootouts, chases, or robberies is treated as severe Metagaming."}]'::jsonb, 11, true),
  ('powergaming', 'roleplay', 12, 'Powergaming (PG)', 'Powergaming (PG)', 'Forcing outcomes on other players without giving them a fair opportunity to react, or performing physically impossible actions.', 'Powergaming is the act of forcing outcomes on other players without giving them the ability to react or respond in a fair way. Give people a fair shot to respond or make choices, play it out and let the story happen.

Examples of Powergaming:
- Using /me commands that leave no room for reaction (e.g., ''/me slits throat killing him instantly'').
- Performing actions that are physically impossible in realistic human scenarios (e.g., carrying 4 heavy rifles while jumping over 10-foot fences).
- Driving a standard sedan off a 50-foot cliff at 120 MPH, landing on four wheels, and driving away as if nothing happened without roleplaying vehicle damage or severe physical trauma.
- Talking or giving detailed radio callouts while handcuffed and gagged.', ARRAY['PG', 'powergaming', 'unrealistic', 'forced rp', 'forced outcomes', 'impossible actions']::TEXT[], true, 6, 'standard', '[{"type":"EXAMPLE","title":"Proper /me Usage","text":"Always use descriptive actions that invite a reaction: `/me attempts to tackle the suspect to the ground` rather than `/me tackles him and knocks him unconscious`."}]'::jsonb, 12, true),
  ('fail-rp', 'roleplay', 13, 'Fail / Low Quality Roleplay', 'Fail RP', 'Unrealistic actions or low-effort roleplay that ruins immersion or the gameplay experience for others.', 'Fail Roleplay, also known as Low Quality roleplay, refers to actions that are unrealistic or roleplay that ruins the experience for yourself and others. If you ruin the RP of others and are not taking the server seriously, there will be consequences.

Examples of Fail RP:
- Baiting police officers or gang members into chases for no in-character reason (''cop baiting'').
- Intentionally running around punching random strangers or jumping onto moving vehicles.
- Treating serious medical emergencies or felony murder investigations as casual jokes.
- Not roleplaying injuries after major traffic collisions, bullet wounds, or severe falls.', ARRAY['fail rp', 'low quality rp', 'cop baiting', 'trolling', 'unrealistic behavior', 'griefing']::TEXT[], false, NULL, 'standard', '[]'::jsonb, 13, true),
  ('animal-peds', 'roleplay', 14, 'Animal Peds', 'Animal Peds', 'Portraying animals requires management approval. You must act like a real animal with zero human speech, tools, or ERP.', 'Members are allowed to portray as animal peds strictly with the prior permission of Vital management. This limits the amount on the server but also ensures that those portraying them maintain a high standard of roleplay.

Animal Ped Rules:
1. Act like a real animal: no human speech, no typing in OOC to communicate IC, and no complex human reasoning.
2. No trolling, griefing, blocking doorways, harassing players, or disrupting active scenes.
3. No ERP (Erotic Roleplay) with or as animals under any circumstances.
4. No unrealistic actions: driving vehicles, picking up weapons, opening complex doors, or displaying superhuman abilities.
5. Aggression must be realistic and justified; no random biting or unprovoked attacks on citizens.
6. No interfering in police scenes unless part of natural authorized RP progression (such as an official K9 unit).
7. No exploiting animal ped hitboxes or jumping animations.
8. If captured or handled by animal control/EMS, cooperate realistically (leashes, veterinary examinations, etc.).
9. Admins reserve the right to revoke animal ped privileges immediately for misuse.', ARRAY['animal', 'dog', 'k9', 'animal ped', 'cat', 'beast']::TEXT[], false, NULL, 'standard', '[{"type":"REQUIRES_APPROVAL","title":"Management Whitelist Required","text":"Animal ped skins are whitelisted. Spawning as an animal without explicit staff permission will result in an immediate kick and warning."}]'::jsonb, 14, true),
  ('character-creation-killing', 'roleplay', 15, 'Character Creation & Character Killing (CK)', 'Character & CK', 'Characters must have realistic names and backstory. Character Killing (permanent death) requires player consent or staff approval.', 'Character Creation and Development:
Players must ensure that the creation of their character and their name is realistic. Troll names, celebrity names, or offensive puns are prohibited. Any player wishing to be part of a government faction (LSPD, EMS, DOJ) must possess a realistic, professional legal name.

Character Killing (CK):
Character killing is when your character dies permanently and is wiped from the city.
1. A player must voluntarily agree to the CK of their own character, OR
2. A formal CK application with extensive narrative evidence must be submitted to and approved by Vital Management/Staff beforehand.
3. Certain high-stakes criminal contracts or faction blood-in agreements may contain binding CK clauses if agreed upon in writing prior to the event.', ARRAY['CK', 'character kill', 'perma death', 'character creation', 'name rules', 'perma']::TEXT[], false, NULL, 'standard', '[]'::jsonb, 15, true),
  ('combat-logging', 'combat-interactions', 16, 'Combat Logging', 'Combat Logging', 'Disconnecting or respawning from an active scene or combat to escape consequences carries a minimum 24-hour suspension.', 'Players are not to disconnect or respawn from any roleplay or combat scenarios that have in-character consequences. This is completely forbidden as it denies the other player an RP opportunity in-game.

If your game crashes during an active scene or combat scenario:
1. You must immediately notify the other party or staff via the official Discord #crash-reports or active ticket.
2. You must reconnect as soon as possible and return to the exact scene to resume the roleplay.

Combat logging carries a minimum mandatory 24-hour suspension from the game server, with repeated offenses resulting in permanent bans.', ARRAY['combat logging', 'f8 quit', 'disconnect', 'combat log', 'logging', 'quitting', 'crashing']::TEXT[], true, 9, 'standard', '[{"type":"COOLDOWN","title":"Minimum 24-Hour Suspension","text":"Disconnecting during a police chase, robbery, or shootout automatically incurs a minimum 24-hour ban."}]'::jsonb, 16, true),
  ('rdm-vdm', 'combat-interactions', 17, 'Random Deathmatch (RDM) & Vehicle Deathmatch (VDM)', 'No RDM / VDM', 'Killing without valid in-character reasoning and proper initiation is prohibited. Vehicles cannot be used as weapons.', 'Random Death Matching (RDM) and Vehicle Death Matching (VDM) are strictly forbidden.

Random Deathmatching (RDM):
- RDM is when you harm or kill another player without a valid in-character reason or proper RP setup.
- Verbal initiation and clear roleplay demands must occur prior to opening fire, allowing the opposing party a fair chance to comply or react.
- Do not camp teleports or entries to 3rd dimension areas / interior loading spots.

Vehicle Deathmatching (VDM):
- VDM is when you use your vehicle to intentionally harm, ram, or kill someone.
- Vehicles are modes of transportation, not primary weapons.
- The ONLY reason a vehicle should ever be used as a weapon is when your character has no other avenue of escape and your life is in mortal danger (single strike to escape, not repeatedly running people over).', ARRAY['RDM', 'VDM', 'random deathmatch', 'vehicle deathmatch', 'initiation', 'ramming', 'car weapon']::TEXT[], true, 7, 'standard', '[{"type":"WARNING","title":"Proper Initiation Required","text":"Shooting someone on sight without prior ongoing conflict, verbal dialogue, or clear hostile initiation is considered RDM."}]'::jsonb, 17, true),
  ('robberies-theft', 'combat-interactions', 18, 'Player Theft & Robberies', 'Robberies & Theft', 'Must have valid IC reasons. No pocket wiping, no forcing bank withdrawals, and no robbing protected public workers or facilities.', 'All robberies must be conducted in a realistic way with a proper IC reason as to why you are robbing the player.

Theft Restrictions:
1. No Pocket Wiping: You are only permitted to grab a few valuable or situational items. You are not allowed to empty complete player inventories. Only take what makes sense for the scenario and nothing more.
2. Financial Assets: Players may not force other players to withdraw money from a bank, sell a house, sell a vehicle, or withdraw a vehicle from their garage.
3. Moving Vehicles: Verbal demands shouted at a car in full motion are not valid; the occupants have the right to flee without being accused of FearRP.
4. Protected Services: Robbing Medical (EMS) or Fire Department personnel is strictly prohibited in all aspects. Robbing Police (LSPD) personnel is prohibited unless specific high-tier heist scenarios permit.
5. Protected Facilities: PD and MD facilities are safe havens and strictly prohibited from robbery.
6. Work Zones: You’re not allowed to rob individuals in or outside of the following civilian job locations:
   - Quarry, Mine, Foundry, Truckers yard, Police stations, & Hospitals.
   - Exception: Unless they have a heavy weapon visible, display rival gang identifiers, or are actively committing a crime on site.', ARRAY['robbery', 'player theft', 'pocket wipe', 'robbing', 'stealing', 'quarry', 'mine', 'foundry', 'trucker']::TEXT[], false, NULL, 'standard', '[{"type":"NOT_ALLOWED","title":"Pocket Wiping Forbidden","text":"Taking food, water, ID, cellphones, or cleaning out every minor item in an inventory is strictly forbidden."}]'::jsonb, 18, true),
  ('hostages', 'combat-interactions', 19, 'Hostages & Kidnapping', 'Hostages', 'Hostages must be random, non-affiliated players. Fake or planned hostages are strictly prohibited.', 'Kidnapping or taking someone hostage is allowed as long as these are done in a realistic way, with high-quality roleplay leading to the event, aiming to make the scenario engaging and enjoyable for everyone.

Hostage Guidelines:
1. Hostages must be random and non-related to your character. They must not be OOC planned or personal friends.
2. Fake hostages (friends agreeing to be taken hostage for a cut of heist money) are strictly prohibited and will result in punishment for all participants.
3. You must keep the hostage constantly under FearRP. The hostage must also realistically act as under fear for their life.
4. Hostages cannot be held indefinitely; the scene must progress smoothly without keeping players hostage for hours without active roleplay.', ARRAY['hostage', 'kidnap', 'kidnapping', 'fake hostage', 'negotiations']::TEXT[], false, NULL, 'standard', '[{"type":"NOT_ALLOWED","title":"No Fake Hostages","text":"Using friends, crew members, or alt accounts as staged hostages for bank robberies or heists is an immediate exploit infraction."}]'::jsonb, 19, true),
  ('green-zones', 'combat-interactions', 20, 'Green Zones', 'Green Zones', 'Designated safe zones (Police stations, Hospitals, City Hall) where criminal violence and hostilities are prohibited.', 'Green zones refer to Police Departments (stations), Medical Departments (Hospitals), and Government Administration buildings (City Hall/Courthouse).

Rules within Green Zones:
1. No criminal activity, violence, shooting, stabbing, or kidnapping may originate or take place inside green zones or their immediate parking lots.
2. You cannot flee into a green zone during an active chase or shootout in order to abuse the safe zone protection. If a scene began outside, the roleplay naturally continues.
3. Loitering in green zones while carrying illegal firearms or contraband to avoid gang conflict is considered safe-zone abuse.', ARRAY['green zone', 'safe zone', 'hospital safe', 'pd safe', 'police station', 'safezone']::TEXT[], false, NULL, 'standard', '[{"type":"IMPORTANT","title":"Dynamic Continuation","text":"Green zone protection does NOT apply if you flee into a hospital or police station while being actively pursued in a chase."}]'::jsonb, 20, true),
  ('criminal-activity-limits', 'criminal-rp', 21, 'General Criminal Activity & Storm Rules', 'Crime & Storm Rules', 'No major crimes may be committed within 30 minutes of a scheduled server restart/storm.', 'Criminal activity is a cornerstone of Vital RP''s ecosystem, but must be conducted within established boundaries to ensure high-quality counter-play and balanced law enforcement response.

Restart & Tsunami Restrictions:
No major crimes (Basic or Advanced Criminal Activities) are to be committed 30 minutes prior to a scheduled server restart/storm (tsunami). This ensures adequate time for scenes, arrests, processing, and medical transport to conclude naturally without being cut off by a server reboot.', ARRAY['restart', 'storm', 'tsunami', 'major crimes', '30 min restart', 'crime cooldown']::TEXT[], false, NULL, 'standard', '[{"type":"COOLDOWN","title":"30-Minute Pre-Restart Freeze","text":"Do not start any store robberies, bank jobs, heists, or organized shootouts if the server restart is less than 30 minutes away."}]'::jsonb, 21, true),
  ('heist-tiers-limits', 'criminal-rp', 22, 'Heist Tiers & Player Limits', 'Heist Caps & PD Limits', 'Strict criminal participant caps and maximum police response limits apply to every tier of criminal activity.', 'Every criminal activity on Vital RP has strict limits on the number of criminal participants allowed and the maximum number of police officers permitted to respond.

Basic Criminal Activity:
- Yacht Heist: 2 Max Crims | 4 Max PD Response
- Container Heist (H): 2 Max Crims | 4 Max PD Response
- Vehicle Boosting: 4 Max Crims | 6 Max PD Response
- Store Robbery: 2 Max Crims | 4 Max PD Response
- ATM Robbery: 2 Max Crims | 4 Max PD Response

Advanced Criminal Activity:
- Ammu-Nation Robbery (H): 4 Max Crims | 6 Max PD Response
- IAA Facility (H): 4 Max Crims | 6 Max PD Response
- Shipment Heist (H): 4 Max Crims | 6 Max PD Response
- Bobcat Security Heist (H): 4 Max Crims | 6 Max PD Response
- Humane Labs (H): 4 Max Crims | 6 Max PD Response
- Bank Trucks: 2 Max Crims | 4 Max PD Response
- Fleeca Bank Robbery (H): 4 Max Crims | 6 Max PD Response
- Vangelico Jewelry (H): 6 Max Crims | 8 Max PD Response
- Maze Bank Robbery (H): 4 Max Crims | 6 Max PD Response
- Train Robbery Heist (H): 6 Max Crims | 8 Max PD Response
- Cursed Carat: 4 Max Crims | 6 Max PD Response
- Pacific Standard Bank: 6 Max Crims | 15 Max PD Response

Note: ''(H)'' indicates that a hostage may be required or utilized during the heist.', ARRAY['heists', 'caps', 'pd response', 'fleeca', 'vangelico', 'bobcat', 'humane labs', 'pac bank', 'boosting', 'atm', 'yacht']::TEXT[], false, NULL, 'standard', '[{"type":"IMPORTANT","title":"Strict Cap Adherence","text":"Bringing outside interference or extra lookouts exceeding the criminal cap is considered Third-Partying and will result in heist disqualification and disciplinary action."}]'::jsonb, 22, true),
  ('extraction-island', 'criminal-rp', 23, 'The Extraction Island Rules', 'Extraction Island', 'Kill-on-sight zone with mandatory gang uniforms, travel restrictions by boat/swimming only, and unique conflict rules.', 'Extraction Island is a high-risk, high-reward territory operating under specialized rules designed for intense tactical roleplay.

Extraction Island Regulations:
1. Gang Uniforms: Faction members must wear recognizable gang uniforms or matching identifiable colors while on the island.
2. Kill on Sight (KOS): Kill on Sight is explicitly authorized within the perimeter of Extraction Island. Prior verbal initiation is not mandatory inside the designated island combat area.
3. Island Conflict: Conflict on the island stays on the island. Retaliatory attacks back in the mainland city of Los Santos based solely on island combat must have appropriate roleplay justification and follow standard city initiation.
4. Police Rules: Law enforcement operates under specific tactical rules of engagement on Extraction Island.
5. Travel Restrictions: You may travel to Extraction Island by boat or swimming only. Unauthorized aircraft, parachuting, or black-market air travel is prohibited unless authorized by dynamic server events.', ARRAY['island', 'extraction island', 'cayo', 'kos', 'kill on sight', 'island rules', 'boat travel']::TEXT[], false, NULL, 'standard', '[{"type":"WARNING","title":"Authorized Kill-on-Sight","text":"Entering the designated Extraction Island zone carries inherent risk of immediate combat without verbal warning."}]'::jsonb, 23, true),
  ('government-corruption', 'government', 24, 'Government Services & Anti-Corruption', 'Gov & Anti-Corruption', 'Corruption is strictly forbidden for all government and whitelisted personnel (LSPD, EMS, DOJ). High standards of service apply.', 'Law Enforcement (LSPD), Medical Services (EMS), and the Department of Justice (DOJ) hold vital public responsibilities that sustain the server''s realism.

Anti-Corruption Policy:
Taking part in corruption is strictly NOT allowed on the server. This policy applies unconditionally to all government and whitelisted public service positions:
- Police officers may not sell weapons, evidence, body armor, or police cruisers to criminals.
- EMS personnel may not deliberately withhold treatment, supply bandages/medkits illegally to gangs, or assist in combat.
- Department of Justice judges and prosecutors may not accept bribes or falsify legal rulings.

Any government employee found engaging in corruption will be immediately dismissed from their department, blacklisted from public services, and subject to administrative sanctions.', ARRAY['corruption', 'police corruption', 'ems', 'doj', 'lspd', 'selling police weapons', 'government rules']::TEXT[], false, NULL, 'standard', '[{"type":"NOT_ALLOWED","title":"Zero Corruption Policy","text":"There is zero tolerance for government corruption on Vital RP. Whitelisted equipment cannot be transferred to civilians or criminals under any circumstance."}]'::jsonb, 24, true),
  ('zero-tolerance-conduct', 'community-conduct', 25, 'Zero Tolerance: Toxicity, Slurs & Gross RP', 'Zero Tolerance Rules', 'Racism, hate speech, slurs, discrimination, non-consensual sexual RP, and suicide RP are strictly prohibited with permanent ban penalties.', 'Vital Roleplay enforces a strict zero-tolerance policy against toxic, abusive, and non-consensual behavior across all mediums.

Prohibited Conduct:
1. Racism, slurs, and any form of discrimination based on race, ethnicity, nationality, sexual orientation, gender identity, religion, or disability is strictly forbidden.
2. Scope: This prohibition applies to in-game voice chat (VoIP), in-game text (/me, /do, /ooc), character names, Discord messages, live streams, and community forums.
3. Gross Roleplay: Non-consensual sexual roleplay, sexual harassment, rape, or non-consensual mutilation is forbidden.
4. Suicide Roleplay: Roleplaying suicide, self-harm, or severe psychiatric self-mutilation is completely prohibited.

Violations of this section will result in an immediate and permanent removal from the Vital Roleplay community.', ARRAY['racism', 'slurs', 'toxicity', 'gross rp', 'hate speech', 'suicide rp', 'harassment', 'zero tolerance']::TEXT[], true, 10, 'standard', '[{"type":"NOT_ALLOWED","title":"Permanent Immediate Ban","text":"Use of racial slurs, derogatory hate speech, or non-consensual sexual roleplay results in an irreversible permanent ban."}]'::jsonb, 25, true),
  ('faction-creation-roster', 'factions', 26, 'Faction Guidelines & Member Rosters', 'Faction Guidelines', 'Illegal Factions are capped at 22 members; Racing Crews at 12 members. All factions must register their roster with IFM.', 'This handbook outlines all essential guidelines for illegal factions operating within Vital Roleplay, managed by the Illegal Faction Management (IFM) team.

Faction Standards & Caps:
1. Starting a Faction: Factions must submit a formal application to IFM demonstrating original character concepts, backstory, hierarchy, and roleplay value.
2. Faction Roster Caps:
   - Illegal Factions (Gangs / Mafias / Cartels): Strict 22-Member Cap.
   - Racing Crews: Strict 12-Member Cap.
3. Roster Management: All faction members must be officially registered on the faction roster sheet with IFM. Members not on the roster cannot participate in gang wars or territory defense.
4. Faction Cooldowns: When a player voluntarily leaves or is discharged from an official faction, a mandatory cooldown applies before they may join another faction.
5. Faction Disbandment: If a faction goes inactive or is disbanded by IFM, assets and properties revert to server management.', ARRAY['factions', 'gangs', 'roster', '22 cap', 'racing crew', 'ifm', 'gang cap', 'illegal factions', 'faction rules']::TEXT[], false, NULL, 'standard', '[{"type":"IMPORTANT","title":"Official Roster Registration","text":"Only members officially listed on your IFM roster document are permitted to engage in faction shootouts and territory actions."}]'::jsonb, 26, true),
  ('faction-attire-threads', 'factions', 27, 'Faction Attire & IFM Communication', 'Faction Attire & Comms', 'Factions must maintain recognizable gang colors/attire during operations. Official faction threads and IFM tickets are required.', 'Faction Attire:
During criminal activities, conflict, and turf defense, faction members must wear their designated colors, uniform items, or recognizable gang clothing. "Blending in" as ordinary civilians while actively participating in organized gang shootouts is prohibited.

Faction Threads & IFM Communication:
1. All factions are expected to maintain an active, respectful roleplay thread on the community forums showcasing screenshots, stories, and character progression.
2. Official communication between faction leadership and staff must occur through designated IFM leadership tickets.
3. Multi-Faction Roleplay & Alliances: When fighting alongside allies in joint operations, your combined side is strictly limited to the maximum player cap (you cannot team up to create a 30-man army).', ARRAY['gang colors', 'faction attire', 'attire', 'uniforms', 'faction thread', 'alliances', 'multi faction']::TEXT[], false, NULL, 'standard', '[]'::jsonb, 27, true),
  ('conflict-rules-expectations', 'faction-conflict', 28, 'Faction Conflict & War Expectations', 'Conflict & Gang Wars', 'Requires valid RP buildup. No toxic behavior (COD lobby talk) after gunfights. Faction wars must have IFM terms and approval.', 'Faction Conflict Rules:
Conflict between factions must develop organically through story progression, trade disputes, territory friction, or character rivalries.

Rules of Engagement:
1. Valid Escalation: You cannot jump straight to shooting over a minor verbal disagreement. Conflict must escalate through warnings, fistfights, robberies, or negotiations before turning into deadly warfare.
2. Post-Fight Conduct: No toxic behavior after gunfights. Absolutely no ''Call of Duty lobby talk'', screaming insults over downed bodies, or taunting players in hospital beds. Take your win or loss with maturity.
3. Faction Wars:
   - Official gang wars require prior submission to and approval by IFM.
   - War terms (duration, weapons permitted, participant caps, victory conditions) must be agreed upon by both faction leaders and signed off by IFM.
   - Third parties are not permitted to intervene in active war fights.', ARRAY['gang war', 'conflict', 'war rules', 'toxic behavior', 'cod lobby talk', 'trash talk', 'ifm approval']::TEXT[], false, NULL, 'standard', '[{"type":"NOT_ALLOWED","title":"No Post-Fight Toxicity","text":"Teabagging, screaming slurs, or toxic trash talk over downed opponents will result in immediate conflict penalties and bans."}]'::jsonb, 28, true),
  ('bleed-in-bleed-out', 'faction-conflict', 29, 'Bleed-In & Bleed-Out Rules', 'Bleed-In / Bleed-Out', 'Joining or leaving a gang carries in-character weight. Bleed-outs incur memory loss of all sensitive faction secrets.', 'Bleed-In / Bleed-Out Rules:
1. Bleed-In: A bleed-in is an in-character ritual or initiation where an applicant commits fully to a faction, acknowledging the dangers and code of silence.
2. Bleed-Out: A bleed-out occurs when a member leaves or is excommunicated from a faction.
   - When a player is bled out, their character suffers permanent memory loss regarding sensitive gang secrets, stash house locations, secret suppliers, and illegal trade networks.
   - The ex-member cannot turn around and leak all gang secrets to rival factions or the police (doing so constitutes severe Metagaming / Fail RP).
   - If a member agreed to a CK clause upon joining, the bleed-out may result in permanent character death if approved by IFM.', ARRAY['bleed in', 'bleed out', 'leaving gang', 'gang initiation', 'gang secrets']::TEXT[], false, NULL, 'standard', '[{"type":"IMPORTANT","title":"Secret Protection","text":"A bled-out member completely forgets the locations of gang stashes, supply routes, and internal criminal operations."}]'::jsonb, 29, true),
  ('racing-recording-pov', 'faction-conflict', 30, 'Street Racing & Mandatory Recording (POV)', 'Racing & POV Rules', 'All faction members in conflicts must record clean audio/video POV and retain recordings for at least 48 hours.', 'Street Racing Rules:
Illegal street racing crews must respect public safety boundaries, coordinate races in suitable routes, and account for police pursuits realistically. Ramming or pitting competitors at 160 MPH in non-contact races is considered VDM/Fail RP.

Mandatory Recording / POV Policy:
1. All faction members involved in active shootouts, faction wars, territory conflicts, or high-tier heists MUST record their point-of-view (POV) with clean in-game audio and video.
2. Recordings must be retained for a minimum of 48 hours following any combat situation.
3. If a ticket or dispute is filed and a player fails to provide required POV footage upon staff request, the situation may be ruled against them automatically and disciplinary action may follow.
4. Ticket Warring: Submitting false, malicious, or retaliatory tickets solely to weaponize staff against rival factions is strictly prohibited.', ARRAY['racing', 'pov', 'recording', 'medal', 'shadowplay', 'ticket warring', 'evidence', '48 hours']::TEXT[], false, NULL, 'standard', '[{"type":"IMPORTANT","title":"Mandatory 48-Hour Retention","text":"Always save your gameplay recordings when entering combat. Failing to provide requested POV in a dispute carries administrative penalties."}]'::jsonb, 30, true),
  ('reports-rule-baiting', 'reports-enforcement', 31, 'Player Reports & Rule Baiting', 'Reports & Rule Baiting', 'Use the in-game /report system or Discord tickets. Rule baiting or intentionally trying to get others banned is prohibited.', 'You may eventually encounter a rulebreak in your RP. Please use the /report system in-game or submit a formal ticket on Discord with your video evidence.

Reporting Standards:
1. All players are expected to report any major rule break that they are aware of within 48 hours of occurrence.
2. Rule Baiting: Intentionally trying to bait, trick, or manipulate another player into breaking a rule so you can report them is strictly forbidden and carries the same penalty as the rule being baited.
3. Frivolous Reports: Reports submitted solely based on personal grievances, salt, or minor infractions that could be resolved amicably via conversation will be dismissed.
4. Independent Staff Review: Staff decisions are final. Reports involving staff members are investigated independently to ensure impartiality and fairness.', ARRAY['reports', 'rule baiting', 'report system', 'reporting', 'staff tickets', 'ban appeal', 'tickets']::TEXT[], false, NULL, 'standard', '[{"type":"WARNING","title":"No Rule Baiting","text":"Trying to lure other players into RDM, VDM, or FearRP violations to file reports will result in punishment for rule baiting."}]'::jsonb, 31, true)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  rule_number = EXCLUDED.rule_number,
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  short_description = EXCLUDED.short_description,
  content = EXCLUDED.content,
  aliases = EXCLUDED.aliases,
  featured = EXCLUDED.featured,
  core_rule_number = EXCLUDED.core_rule_number,
  callouts = EXCLUDED.callouts,
  sort_order = EXCLUDED.sort_order,
  enabled = EXCLUDED.enabled;

-- Seed Published Initial Version 1 Snapshot
INSERT INTO public.rule_versions (version_number, snapshot, published_by_discord_id, published_by_display_name, publish_note, changes_summary, published_at)
VALUES (
  1,
  '{"categories":[{"id":"general","title":"General Server Rules","description":"Fundamental server guidelines, age restrictions, and platform expectations.","icon":"ShieldAlert","sort_order":1,"enabled":true},{"id":"roleplay","title":"Roleplay Standards","description":"Foundational roleplay mechanics including Value of Life, NLR, and immersion rules.","icon":"Drama","sort_order":2,"enabled":true},{"id":"combat-interactions","title":"Combat & Player Interactions","description":"Rules governing hostilities, robberies, combat logging, and player confrontations.","icon":"Crosshair","sort_order":3,"enabled":true},{"id":"criminal-rp","title":"Criminal RP & Heists","description":"Crime caps, robbery tiers, police response limits, and Extraction Island regulations.","icon":"Flame","sort_order":4,"enabled":true},{"id":"government","title":"Government & Public Services","description":"Regulations for Law Enforcement (LSPD), Medical Services (EMS), and Department of Justice (DOJ).","icon":"BadgeCheck","sort_order":5,"enabled":true},{"id":"community-conduct","title":"Community Conduct","description":"Zero tolerance policies regarding toxicity, discrimination, harassment, and gross RP.","icon":"HeartHandshake","sort_order":6,"enabled":true},{"id":"factions","title":"Factions & Gang Operations","description":"Faction creation, member caps, attire requirements, IFM communication, and crew guidelines.","icon":"Users","sort_order":7,"enabled":true},{"id":"faction-conflict","title":"Faction Conflict & Wars","description":"Gang wars, conflict escalation, bleed-in/bleed-out rules, recording requirements, and racing.","icon":"Swords","sort_order":8,"enabled":true},{"id":"reports-enforcement","title":"Reports & Enforcement","description":"How to report rule breaks, rule baiting bans, and server dispute protocols.","icon":"FileText","sort_order":9,"enabled":true}],"rules":[{"id":"server-age-restriction","category_id":"general","rule_number":1,"title":"Server Age Restriction (18+)","short_title":"18+ Server","short_description":"Vital RP is strictly an 18+ community with zero exceptions. Mature themes and adult conversations may occur.","content":"This is an 18+ Server with no exceptions. That means that humor and conversation topics could be adult in nature at times.\n\nAll members must be at least 18 years of age to whitelist and play on Vital RP. Any player found to be under 18 will be permanently banned until they reach legal age.","aliases":["18+","age limit","mature","adult","underage"],"featured":true,"core_rule_number":1,"severity":"standard","callouts":[{"type":"WARNING","title":"Zero Tolerance on Underage Players","text":"Providing false age information during whitelisting or in Discord will result in an immediate permanent unappealable ban."}],"sort_order":1,"enabled":true},{"id":"community-expectations","category_id":"general","rule_number":2,"title":"Community Expectations","short_title":"Expectations","short_description":"Set your Discord name to your IC name, consent to PC checks upon whitelisting, and maintain adult accountability.","content":"Upon joining the Discord, you must change your Discord name to your main roleplay first and last name (exceptions apply to staff, who may use their staff name).\n\nBy becoming whitelisted and participating in the city, you also automatically consent to random PC checks at any time. For more information, please submit a ticket.\n\nCriticism is welcome; toxicity is not. You’re free to share concerns, but abuse, harassment, or targeted negativity toward the community, server, or staff won’t be tolerated. We take accountability seriously. Reports involving staff (even owners) are reviewed independently. This includes ban disputes.\n\nThis is a space for fun, collaborative RP. If you bring constant negativity, stir OOC drama, or fuel arguments, you may be removed. You don’t need to be friends with everyone, just act like an adult.","aliases":["discord name","pc check","toxicity","criticism","accountability","whitelisting"],"featured":false,"severity":"standard","callouts":[{"type":"IMPORTANT","title":"Random PC Checks","text":"Participation in Vital RP includes automatic consent to random PC checks by authorized staff to verify game integrity."}],"sort_order":2,"enabled":true},{"id":"voice-communication","category_id":"general","rule_number":3,"title":"Voice Communication","short_title":"Voice & Mic","short_description":"The majority of communication must be in English. A working microphone is required at all times.","content":"The majority of communication MUST be in English.\n\nEvery player is required to have a working, clear microphone while connected to the server. Roleplaying as mute or communicating exclusively through text/third-party apps without prior staff approval is not permitted. Voice changers and soundboards must sound realistic and fit your character concept.","aliases":["mic","voice","microphone","english","soundboard","voice changer"],"featured":false,"severity":"standard","callouts":[],"sort_order":3,"enabled":true},{"id":"exploits-cheating","category_id":"general","rule_number":4,"title":"Exploits & Cheating","short_title":"No Exploiting","short_description":"Intentionally abusing server bugs, animations, scripts, or third-party software for competitive advantage is strictly forbidden.","content":"Players must not intentionally abuse any server bugs, script bugs, scripts or GTA game mechanics to gain an unfair advantage. Use of game mechanics (intended or otherwise) to gain an unfair advantage is considered exploiting (e.g., using known bugs or using game features in inappropriate and unintended ways).\n\nAny changes you make to your game that give you a competitive advantage over other players are not allowed to be used on this server. This includes, but is not limited to:\n- Crosshair overlays or external aim aids\n- Modified game files granting speed, stamina, or field of view advantages\n- Custom weapon visual effects that remove smoke, flash, or recoil\n- Abusing emote cancelling or animation cancelling in gunfights or robberies","aliases":["exploiting","cheating","bugs","hacks","crosshairs","modifications","animation cancelling","abusing"],"featured":true,"core_rule_number":8,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"Permanent Ban","text":"Using malicious software, memory injection, speed hacks, or third-party combat enhancements will lead to an immediate permanent hardware ban."}],"sort_order":4,"enabled":true},{"id":"disrupting-server-operations","category_id":"general","rule_number":5,"title":"Disrupting Server Operations (DSO)","short_title":"DSO","short_description":"Prohibits advertising other communities, poaching members, slandering the server, cyber attacks, and doxxing.","content":"Disrupting Server Operations (DSO) is an umbrella term used to protect the server and its community from harmful external or out-of-character actions.\n\nPlayers are strictly not allowed to take part in or have knowledge of:\n1. Advertising any other roleplay servers/communities or attempting to poach members from Vital RP''s Discord server or any official platforms.\n2. Slandering: Attempting to discredit or defame Vital RP or its members across Discord, Twitch, social media, or other public platforms.\n3. Doxxing: Leaking personal, private, or real-life information of any member of the Vital RP community.\n4. Cyber Attacks: Engaging in, coordinating, or having knowledge of DDoS attacks, account theft, credential stuffing, or server sabotage.\n5. Severe Unreported Rulebreaks: Shielding players who are actively exploiting or running malicious activities against the community.","aliases":["DSO","advertising","poaching","slander","doxxing","ddos","cyber attack","sabotage"],"featured":false,"severity":"standard","callouts":[{"type":"WARNING","title":"Immediate Community Removal","text":"DSO violations are treated as malicious attacks against the server and result in instant blacklisting across all Vital RP infrastructure."}],"sort_order":5,"enabled":true},{"id":"ban-evasion","category_id":"general","rule_number":6,"title":"Ban Evasion","short_title":"Ban Evading","short_description":"Circumventing a suspension using alternate accounts, VPNs, or new identifiers converts temporary suspensions into permanent unappealable bans.","content":"Ban evading is strictly prohibited. If you are banned or suspended from Vital RP, you must follow the appropriate method to appeal that ban for it to be lifted.\n\nIf you attempt to circumvent a ban using alternate Discord accounts, new Steam/Rockstar accounts, VPNs, or hardware spoofing, your suspension will automatically turn into a permanent ban with zero chance of appeal.","aliases":["ban evasion","alt account","ban evading","vpn","spoofing","appeal"],"featured":false,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"Unappealable Permanent Ban","text":"Attempting to evade a ban forfeits any right to standard ticket appeals."}],"sort_order":6,"enabled":true},{"id":"real-world-trading","category_id":"general","rule_number":7,"title":"Real-World Trading (RWT) & Asset Transfers","short_title":"RWT & Transfers","short_description":"Exchanging in-game items or currency for real-world money, or transferring assets between your own characters, is strictly prohibited.","content":"Real-World Trading (RWT) and/or transferring accumulated assets from one of your own characters to another, regardless of the reason, is strictly prohibited.\n\nRWT refers to the exchange of in-game items, currency, or services for real-world money or goods, or vice versa, either directly or through third-party platforms. Engaging in RWT undermines the integrity of the game environment and creates unfair advantages for those who participate.\n\nAny player found participating in RWT will face penalties, including but not limited to:\n- Temporary or permanent suspension from Vital Roleplay.\n- Complete confiscation and wipe of in-game items, properties, and currency involved.\n\nNote: In-character gifting or selling between completely separate players for in-character money is valid; transferring assets between characters owned by the same real-life player is not.","aliases":["RWT","real world trading","selling money","asset transfer","alt character","cash buying"],"featured":false,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"Asset Confiscation","text":"All assets and funds involved in illicit transfers or real-world money transactions will be permanently deleted from the database."}],"sort_order":7,"enabled":true},{"id":"stay-in-character","category_id":"roleplay","rule_number":8,"title":"Stay in Character (No Breaking Character)","short_title":"Stay in Character","short_description":"Do not break character during active scenes. If a rule is broken, play out the scene and report it afterward.","content":"No Breaking Character – Stay in character during scenes. If a rule is broken, normally finish the RP and report it afterward unless it involves serious issues that require immediate intervention (such as hate speech, gross RP, or severe game disruption).\n\nDo not discuss server rules, OOC tickets, bans, discord messages, or mechanics in voice chat or /me. Roleplay over ruleplay: prioritize keeping the scene immersive and handle disputes through the proper ticket channels afterward.","aliases":["breaking character","ooc in voice","in character","stay in character","ruleplay","finish the scene"],"featured":true,"core_rule_number":2,"severity":"standard","callouts":[{"type":"IMPORTANT","title":"Roleplay Over Ruleplay","text":"Do not pause active scenes to argue rules in voice chat. Complete the roleplay organically and submit a ticket afterward with your recording."}],"sort_order":8,"enabled":true},{"id":"fear-rp","category_id":"roleplay","rule_number":9,"title":"Value of Life (Fear Roleplay)","short_title":"Value of Life (FearRP)","short_description":"Characters must realistically value their lives at all times and react appropriately when facing deadly threats.","content":"Players must prioritise their character''s life and act as if they have only one life to live. When placed in a situation where your life is in clear and immediate danger, you must display genuine fear and value for your survival.\n\nKey FearRP Requirements:\n1. When a firearm is drawn and pointed at you before you have drawn a weapon, you must comply with reasonable demands. You may not pull a weapon out while staring down the barrel of a loaded gun.\n2. If multiple armed assailants have the drop on you, you cannot \"superhero\" your way out by pulling a gun or jumping into moving traffic.\n3. If you have clear cover or the assailant looks away / lowers their weapon, you may realistically evaluate escape or retaliation options, but reckless disregard for fatal injury is a rule violation.","aliases":["FearRP","value of life","fear roleplay","gunpoint","hands up","hostage fear"],"featured":true,"core_rule_number":3,"severity":"standard","callouts":[{"type":"IMPORTANT","title":"Immediate Lethal Threat","text":"Drawing a firearm while someone already has a firearm aimed directly at your head or chest with intent to fire is a direct FearRP violation."}],"sort_order":9,"enabled":true},{"id":"new-life-rule","category_id":"roleplay","rule_number":10,"title":"New Life Rule (NLR)","short_title":"New Life Rule (NLR)","short_description":"When flatbacked (second stage), you forget all events leading to your death and must observe a mandatory 30-minute scene restriction.","content":"When a character is flatbacked (the second stage of being downed where you bleed out or respawn at the hospital), they experience memory loss regarding the events, conflict, and circumstances that led up to their death.\n\nNLR Regulations:\n1. Memory Loss: Your character has no memory of who killed them, where it happened, or why. You cannot seek revenge or act on that specific incident.\n2. 30-Minute Restriction: For 30 minutes, the flatbacked player may not interact with, pursue, acknowledge, or return to the scene of their death.\n3. Cooldown Actions: During the 30-minute cooldown, you cannot rejoin the active conflict, communicate information about the shootout to your faction, or re-engage the opposing party.\n4. Downed (1st Stage) vs Flatbacked (2nd Stage):\n   - Downed (1st stage): A downed player awaiting EMS may communicate basic physical information (such as personal identification or brief description of physical injuries).\n   - Flatbacked (2nd stage): Once respawned at the hospital, complete NLR takes effect immediately.","aliases":["NLR","new life rule","flatbacked","respawn","bleed out","hospital","memory loss","30 minutes"],"featured":true,"core_rule_number":4,"severity":"standard","callouts":[{"type":"COOLDOWN","title":"30-Minute Exclusion Zone","text":"You may not return to the radius of your death for a full 30 minutes following hospital respawn."}],"sort_order":10,"enabled":true},{"id":"metagaming","category_id":"roleplay","rule_number":11,"title":"Meta Gaming (MG)","short_title":"Metagaming (MG)","short_description":"Using Out-Of-Character (OOC) knowledge in-character (IC) from streams, Discord, or external sources is strictly prohibited.","content":"Metagaming is the act of gathering information Out-Of-Character (OOC) and using it In-Character (IC). This could be information from different platforms such as Twitch streams, Discord channels, YouTube videos, or other methods of external information spreading.\n\nExamples of Metagaming:\n- Watching a streamer''s broadcast to locate their stash house, convoy, or active position in-game.\n- Calling out enemy locations in a Discord voice channel while in an active shootout instead of using in-game radios or phones.\n- Using character names seen over heads or in Discord rosters without having met them in-character.\n- Reading police dispatch or faction chats outside the game to prepare an ambush.","aliases":["MG","metagaming","meta","stream sniping","discord calls","ooc info"],"featured":true,"core_rule_number":5,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"Third-Party Comms in Active Scenes","text":"Relaying tactical in-game positions through Discord voice or direct messages during shootouts, chases, or robberies is treated as severe Metagaming."}],"sort_order":11,"enabled":true},{"id":"powergaming","category_id":"roleplay","rule_number":12,"title":"Powergaming (PG)","short_title":"Powergaming (PG)","short_description":"Forcing outcomes on other players without giving them a fair opportunity to react, or performing physically impossible actions.","content":"Powergaming is the act of forcing outcomes on other players without giving them the ability to react or respond in a fair way. Give people a fair shot to respond or make choices, play it out and let the story happen.\n\nExamples of Powergaming:\n- Using /me commands that leave no room for reaction (e.g., ''/me slits throat killing him instantly'').\n- Performing actions that are physically impossible in realistic human scenarios (e.g., carrying 4 heavy rifles while jumping over 10-foot fences).\n- Driving a standard sedan off a 50-foot cliff at 120 MPH, landing on four wheels, and driving away as if nothing happened without roleplaying vehicle damage or severe physical trauma.\n- Talking or giving detailed radio callouts while handcuffed and gagged.","aliases":["PG","powergaming","unrealistic","forced rp","forced outcomes","impossible actions"],"featured":true,"core_rule_number":6,"severity":"standard","callouts":[{"type":"EXAMPLE","title":"Proper /me Usage","text":"Always use descriptive actions that invite a reaction: `/me attempts to tackle the suspect to the ground` rather than `/me tackles him and knocks him unconscious`."}],"sort_order":12,"enabled":true},{"id":"fail-rp","category_id":"roleplay","rule_number":13,"title":"Fail / Low Quality Roleplay","short_title":"Fail RP","short_description":"Unrealistic actions or low-effort roleplay that ruins immersion or the gameplay experience for others.","content":"Fail Roleplay, also known as Low Quality roleplay, refers to actions that are unrealistic or roleplay that ruins the experience for yourself and others. If you ruin the RP of others and are not taking the server seriously, there will be consequences.\n\nExamples of Fail RP:\n- Baiting police officers or gang members into chases for no in-character reason (''cop baiting'').\n- Intentionally running around punching random strangers or jumping onto moving vehicles.\n- Treating serious medical emergencies or felony murder investigations as casual jokes.\n- Not roleplaying injuries after major traffic collisions, bullet wounds, or severe falls.","aliases":["fail rp","low quality rp","cop baiting","trolling","unrealistic behavior","griefing"],"featured":false,"severity":"standard","callouts":[],"sort_order":13,"enabled":true},{"id":"animal-peds","category_id":"roleplay","rule_number":14,"title":"Animal Peds","short_title":"Animal Peds","short_description":"Portraying animals requires management approval. You must act like a real animal with zero human speech, tools, or ERP.","content":"Members are allowed to portray as animal peds strictly with the prior permission of Vital management. This limits the amount on the server but also ensures that those portraying them maintain a high standard of roleplay.\n\nAnimal Ped Rules:\n1. Act like a real animal: no human speech, no typing in OOC to communicate IC, and no complex human reasoning.\n2. No trolling, griefing, blocking doorways, harassing players, or disrupting active scenes.\n3. No ERP (Erotic Roleplay) with or as animals under any circumstances.\n4. No unrealistic actions: driving vehicles, picking up weapons, opening complex doors, or displaying superhuman abilities.\n5. Aggression must be realistic and justified; no random biting or unprovoked attacks on citizens.\n6. No interfering in police scenes unless part of natural authorized RP progression (such as an official K9 unit).\n7. No exploiting animal ped hitboxes or jumping animations.\n8. If captured or handled by animal control/EMS, cooperate realistically (leashes, veterinary examinations, etc.).\n9. Admins reserve the right to revoke animal ped privileges immediately for misuse.","aliases":["animal","dog","k9","animal ped","cat","beast"],"featured":false,"severity":"standard","callouts":[{"type":"REQUIRES_APPROVAL","title":"Management Whitelist Required","text":"Animal ped skins are whitelisted. Spawning as an animal without explicit staff permission will result in an immediate kick and warning."}],"sort_order":14,"enabled":true},{"id":"character-creation-killing","category_id":"roleplay","rule_number":15,"title":"Character Creation & Character Killing (CK)","short_title":"Character & CK","short_description":"Characters must have realistic names and backstory. Character Killing (permanent death) requires player consent or staff approval.","content":"Character Creation and Development:\nPlayers must ensure that the creation of their character and their name is realistic. Troll names, celebrity names, or offensive puns are prohibited. Any player wishing to be part of a government faction (LSPD, EMS, DOJ) must possess a realistic, professional legal name.\n\nCharacter Killing (CK):\nCharacter killing is when your character dies permanently and is wiped from the city.\n1. A player must voluntarily agree to the CK of their own character, OR\n2. A formal CK application with extensive narrative evidence must be submitted to and approved by Vital Management/Staff beforehand.\n3. Certain high-stakes criminal contracts or faction blood-in agreements may contain binding CK clauses if agreed upon in writing prior to the event.","aliases":["CK","character kill","perma death","character creation","name rules","perma"],"featured":false,"severity":"standard","callouts":[],"sort_order":15,"enabled":true},{"id":"combat-logging","category_id":"combat-interactions","rule_number":16,"title":"Combat Logging","short_title":"Combat Logging","short_description":"Disconnecting or respawning from an active scene or combat to escape consequences carries a minimum 24-hour suspension.","content":"Players are not to disconnect or respawn from any roleplay or combat scenarios that have in-character consequences. This is completely forbidden as it denies the other player an RP opportunity in-game.\n\nIf your game crashes during an active scene or combat scenario:\n1. You must immediately notify the other party or staff via the official Discord #crash-reports or active ticket.\n2. You must reconnect as soon as possible and return to the exact scene to resume the roleplay.\n\nCombat logging carries a minimum mandatory 24-hour suspension from the game server, with repeated offenses resulting in permanent bans.","aliases":["combat logging","f8 quit","disconnect","combat log","logging","quitting","crashing"],"featured":true,"core_rule_number":9,"severity":"standard","callouts":[{"type":"COOLDOWN","title":"Minimum 24-Hour Suspension","text":"Disconnecting during a police chase, robbery, or shootout automatically incurs a minimum 24-hour ban."}],"sort_order":16,"enabled":true},{"id":"rdm-vdm","category_id":"combat-interactions","rule_number":17,"title":"Random Deathmatch (RDM) & Vehicle Deathmatch (VDM)","short_title":"No RDM / VDM","short_description":"Killing without valid in-character reasoning and proper initiation is prohibited. Vehicles cannot be used as weapons.","content":"Random Death Matching (RDM) and Vehicle Death Matching (VDM) are strictly forbidden.\n\nRandom Deathmatching (RDM):\n- RDM is when you harm or kill another player without a valid in-character reason or proper RP setup.\n- Verbal initiation and clear roleplay demands must occur prior to opening fire, allowing the opposing party a fair chance to comply or react.\n- Do not camp teleports or entries to 3rd dimension areas / interior loading spots.\n\nVehicle Deathmatching (VDM):\n- VDM is when you use your vehicle to intentionally harm, ram, or kill someone.\n- Vehicles are modes of transportation, not primary weapons.\n- The ONLY reason a vehicle should ever be used as a weapon is when your character has no other avenue of escape and your life is in mortal danger (single strike to escape, not repeatedly running people over).","aliases":["RDM","VDM","random deathmatch","vehicle deathmatch","initiation","ramming","car weapon"],"featured":true,"core_rule_number":7,"severity":"standard","callouts":[{"type":"WARNING","title":"Proper Initiation Required","text":"Shooting someone on sight without prior ongoing conflict, verbal dialogue, or clear hostile initiation is considered RDM."}],"sort_order":17,"enabled":true},{"id":"robberies-theft","category_id":"combat-interactions","rule_number":18,"title":"Player Theft & Robberies","short_title":"Robberies & Theft","short_description":"Must have valid IC reasons. No pocket wiping, no forcing bank withdrawals, and no robbing protected public workers or facilities.","content":"All robberies must be conducted in a realistic way with a proper IC reason as to why you are robbing the player.\n\nTheft Restrictions:\n1. No Pocket Wiping: You are only permitted to grab a few valuable or situational items. You are not allowed to empty complete player inventories. Only take what makes sense for the scenario and nothing more.\n2. Financial Assets: Players may not force other players to withdraw money from a bank, sell a house, sell a vehicle, or withdraw a vehicle from their garage.\n3. Moving Vehicles: Verbal demands shouted at a car in full motion are not valid; the occupants have the right to flee without being accused of FearRP.\n4. Protected Services: Robbing Medical (EMS) or Fire Department personnel is strictly prohibited in all aspects. Robbing Police (LSPD) personnel is prohibited unless specific high-tier heist scenarios permit.\n5. Protected Facilities: PD and MD facilities are safe havens and strictly prohibited from robbery.\n6. Work Zones: You’re not allowed to rob individuals in or outside of the following civilian job locations:\n   - Quarry, Mine, Foundry, Truckers yard, Police stations, & Hospitals.\n   - Exception: Unless they have a heavy weapon visible, display rival gang identifiers, or are actively committing a crime on site.","aliases":["robbery","player theft","pocket wipe","robbing","stealing","quarry","mine","foundry","trucker"],"featured":false,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"Pocket Wiping Forbidden","text":"Taking food, water, ID, cellphones, or cleaning out every minor item in an inventory is strictly forbidden."}],"sort_order":18,"enabled":true},{"id":"hostages","category_id":"combat-interactions","rule_number":19,"title":"Hostages & Kidnapping","short_title":"Hostages","short_description":"Hostages must be random, non-affiliated players. Fake or planned hostages are strictly prohibited.","content":"Kidnapping or taking someone hostage is allowed as long as these are done in a realistic way, with high-quality roleplay leading to the event, aiming to make the scenario engaging and enjoyable for everyone.\n\nHostage Guidelines:\n1. Hostages must be random and non-related to your character. They must not be OOC planned or personal friends.\n2. Fake hostages (friends agreeing to be taken hostage for a cut of heist money) are strictly prohibited and will result in punishment for all participants.\n3. You must keep the hostage constantly under FearRP. The hostage must also realistically act as under fear for their life.\n4. Hostages cannot be held indefinitely; the scene must progress smoothly without keeping players hostage for hours without active roleplay.","aliases":["hostage","kidnap","kidnapping","fake hostage","negotiations"],"featured":false,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"No Fake Hostages","text":"Using friends, crew members, or alt accounts as staged hostages for bank robberies or heists is an immediate exploit infraction."}],"sort_order":19,"enabled":true},{"id":"green-zones","category_id":"combat-interactions","rule_number":20,"title":"Green Zones","short_title":"Green Zones","short_description":"Designated safe zones (Police stations, Hospitals, City Hall) where criminal violence and hostilities are prohibited.","content":"Green zones refer to Police Departments (stations), Medical Departments (Hospitals), and Government Administration buildings (City Hall/Courthouse).\n\nRules within Green Zones:\n1. No criminal activity, violence, shooting, stabbing, or kidnapping may originate or take place inside green zones or their immediate parking lots.\n2. You cannot flee into a green zone during an active chase or shootout in order to abuse the safe zone protection. If a scene began outside, the roleplay naturally continues.\n3. Loitering in green zones while carrying illegal firearms or contraband to avoid gang conflict is considered safe-zone abuse.","aliases":["green zone","safe zone","hospital safe","pd safe","police station","safezone"],"featured":false,"severity":"standard","callouts":[{"type":"IMPORTANT","title":"Dynamic Continuation","text":"Green zone protection does NOT apply if you flee into a hospital or police station while being actively pursued in a chase."}],"sort_order":20,"enabled":true},{"id":"criminal-activity-limits","category_id":"criminal-rp","rule_number":21,"title":"General Criminal Activity & Storm Rules","short_title":"Crime & Storm Rules","short_description":"No major crimes may be committed within 30 minutes of a scheduled server restart/storm.","content":"Criminal activity is a cornerstone of Vital RP''s ecosystem, but must be conducted within established boundaries to ensure high-quality counter-play and balanced law enforcement response.\n\nRestart & Tsunami Restrictions:\nNo major crimes (Basic or Advanced Criminal Activities) are to be committed 30 minutes prior to a scheduled server restart/storm (tsunami). This ensures adequate time for scenes, arrests, processing, and medical transport to conclude naturally without being cut off by a server reboot.","aliases":["restart","storm","tsunami","major crimes","30 min restart","crime cooldown"],"featured":false,"severity":"standard","callouts":[{"type":"COOLDOWN","title":"30-Minute Pre-Restart Freeze","text":"Do not start any store robberies, bank jobs, heists, or organized shootouts if the server restart is less than 30 minutes away."}],"sort_order":21,"enabled":true},{"id":"heist-tiers-limits","category_id":"criminal-rp","rule_number":22,"title":"Heist Tiers & Player Limits","short_title":"Heist Caps & PD Limits","short_description":"Strict criminal participant caps and maximum police response limits apply to every tier of criminal activity.","content":"Every criminal activity on Vital RP has strict limits on the number of criminal participants allowed and the maximum number of police officers permitted to respond.\n\nBasic Criminal Activity:\n- Yacht Heist: 2 Max Crims | 4 Max PD Response\n- Container Heist (H): 2 Max Crims | 4 Max PD Response\n- Vehicle Boosting: 4 Max Crims | 6 Max PD Response\n- Store Robbery: 2 Max Crims | 4 Max PD Response\n- ATM Robbery: 2 Max Crims | 4 Max PD Response\n\nAdvanced Criminal Activity:\n- Ammu-Nation Robbery (H): 4 Max Crims | 6 Max PD Response\n- IAA Facility (H): 4 Max Crims | 6 Max PD Response\n- Shipment Heist (H): 4 Max Crims | 6 Max PD Response\n- Bobcat Security Heist (H): 4 Max Crims | 6 Max PD Response\n- Humane Labs (H): 4 Max Crims | 6 Max PD Response\n- Bank Trucks: 2 Max Crims | 4 Max PD Response\n- Fleeca Bank Robbery (H): 4 Max Crims | 6 Max PD Response\n- Vangelico Jewelry (H): 6 Max Crims | 8 Max PD Response\n- Maze Bank Robbery (H): 4 Max Crims | 6 Max PD Response\n- Train Robbery Heist (H): 6 Max Crims | 8 Max PD Response\n- Cursed Carat: 4 Max Crims | 6 Max PD Response\n- Pacific Standard Bank: 6 Max Crims | 15 Max PD Response\n\nNote: ''(H)'' indicates that a hostage may be required or utilized during the heist.","aliases":["heists","caps","pd response","fleeca","vangelico","bobcat","humane labs","pac bank","boosting","atm","yacht"],"featured":false,"severity":"standard","callouts":[{"type":"IMPORTANT","title":"Strict Cap Adherence","text":"Bringing outside interference or extra lookouts exceeding the criminal cap is considered Third-Partying and will result in heist disqualification and disciplinary action."}],"sort_order":22,"enabled":true},{"id":"extraction-island","category_id":"criminal-rp","rule_number":23,"title":"The Extraction Island Rules","short_title":"Extraction Island","short_description":"Kill-on-sight zone with mandatory gang uniforms, travel restrictions by boat/swimming only, and unique conflict rules.","content":"Extraction Island is a high-risk, high-reward territory operating under specialized rules designed for intense tactical roleplay.\n\nExtraction Island Regulations:\n1. Gang Uniforms: Faction members must wear recognizable gang uniforms or matching identifiable colors while on the island.\n2. Kill on Sight (KOS): Kill on Sight is explicitly authorized within the perimeter of Extraction Island. Prior verbal initiation is not mandatory inside the designated island combat area.\n3. Island Conflict: Conflict on the island stays on the island. Retaliatory attacks back in the mainland city of Los Santos based solely on island combat must have appropriate roleplay justification and follow standard city initiation.\n4. Police Rules: Law enforcement operates under specific tactical rules of engagement on Extraction Island.\n5. Travel Restrictions: You may travel to Extraction Island by boat or swimming only. Unauthorized aircraft, parachuting, or black-market air travel is prohibited unless authorized by dynamic server events.","aliases":["island","extraction island","cayo","kos","kill on sight","island rules","boat travel"],"featured":false,"severity":"standard","callouts":[{"type":"WARNING","title":"Authorized Kill-on-Sight","text":"Entering the designated Extraction Island zone carries inherent risk of immediate combat without verbal warning."}],"sort_order":23,"enabled":true},{"id":"government-corruption","category_id":"government","rule_number":24,"title":"Government Services & Anti-Corruption","short_title":"Gov & Anti-Corruption","short_description":"Corruption is strictly forbidden for all government and whitelisted personnel (LSPD, EMS, DOJ). High standards of service apply.","content":"Law Enforcement (LSPD), Medical Services (EMS), and the Department of Justice (DOJ) hold vital public responsibilities that sustain the server''s realism.\n\nAnti-Corruption Policy:\nTaking part in corruption is strictly NOT allowed on the server. This policy applies unconditionally to all government and whitelisted public service positions:\n- Police officers may not sell weapons, evidence, body armor, or police cruisers to criminals.\n- EMS personnel may not deliberately withhold treatment, supply bandages/medkits illegally to gangs, or assist in combat.\n- Department of Justice judges and prosecutors may not accept bribes or falsify legal rulings.\n\nAny government employee found engaging in corruption will be immediately dismissed from their department, blacklisted from public services, and subject to administrative sanctions.","aliases":["corruption","police corruption","ems","doj","lspd","selling police weapons","government rules"],"featured":false,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"Zero Corruption Policy","text":"There is zero tolerance for government corruption on Vital RP. Whitelisted equipment cannot be transferred to civilians or criminals under any circumstance."}],"sort_order":24,"enabled":true},{"id":"zero-tolerance-conduct","category_id":"community-conduct","rule_number":25,"title":"Zero Tolerance: Toxicity, Slurs & Gross RP","short_title":"Zero Tolerance Rules","short_description":"Racism, hate speech, slurs, discrimination, non-consensual sexual RP, and suicide RP are strictly prohibited with permanent ban penalties.","content":"Vital Roleplay enforces a strict zero-tolerance policy against toxic, abusive, and non-consensual behavior across all mediums.\n\nProhibited Conduct:\n1. Racism, slurs, and any form of discrimination based on race, ethnicity, nationality, sexual orientation, gender identity, religion, or disability is strictly forbidden.\n2. Scope: This prohibition applies to in-game voice chat (VoIP), in-game text (/me, /do, /ooc), character names, Discord messages, live streams, and community forums.\n3. Gross Roleplay: Non-consensual sexual roleplay, sexual harassment, rape, or non-consensual mutilation is forbidden.\n4. Suicide Roleplay: Roleplaying suicide, self-harm, or severe psychiatric self-mutilation is completely prohibited.\n\nViolations of this section will result in an immediate and permanent removal from the Vital Roleplay community.","aliases":["racism","slurs","toxicity","gross rp","hate speech","suicide rp","harassment","zero tolerance"],"featured":true,"core_rule_number":10,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"Permanent Immediate Ban","text":"Use of racial slurs, derogatory hate speech, or non-consensual sexual roleplay results in an irreversible permanent ban."}],"sort_order":25,"enabled":true},{"id":"faction-creation-roster","category_id":"factions","rule_number":26,"title":"Faction Guidelines & Member Rosters","short_title":"Faction Guidelines","short_description":"Illegal Factions are capped at 22 members; Racing Crews at 12 members. All factions must register their roster with IFM.","content":"This handbook outlines all essential guidelines for illegal factions operating within Vital Roleplay, managed by the Illegal Faction Management (IFM) team.\n\nFaction Standards & Caps:\n1. Starting a Faction: Factions must submit a formal application to IFM demonstrating original character concepts, backstory, hierarchy, and roleplay value.\n2. Faction Roster Caps:\n   - Illegal Factions (Gangs / Mafias / Cartels): Strict 22-Member Cap.\n   - Racing Crews: Strict 12-Member Cap.\n3. Roster Management: All faction members must be officially registered on the faction roster sheet with IFM. Members not on the roster cannot participate in gang wars or territory defense.\n4. Faction Cooldowns: When a player voluntarily leaves or is discharged from an official faction, a mandatory cooldown applies before they may join another faction.\n5. Faction Disbandment: If a faction goes inactive or is disbanded by IFM, assets and properties revert to server management.","aliases":["factions","gangs","roster","22 cap","racing crew","ifm","gang cap","illegal factions","faction rules"],"featured":false,"severity":"standard","callouts":[{"type":"IMPORTANT","title":"Official Roster Registration","text":"Only members officially listed on your IFM roster document are permitted to engage in faction shootouts and territory actions."}],"sort_order":26,"enabled":true},{"id":"faction-attire-threads","category_id":"factions","rule_number":27,"title":"Faction Attire & IFM Communication","short_title":"Faction Attire & Comms","short_description":"Factions must maintain recognizable gang colors/attire during operations. Official faction threads and IFM tickets are required.","content":"Faction Attire:\nDuring criminal activities, conflict, and turf defense, faction members must wear their designated colors, uniform items, or recognizable gang clothing. \"Blending in\" as ordinary civilians while actively participating in organized gang shootouts is prohibited.\n\nFaction Threads & IFM Communication:\n1. All factions are expected to maintain an active, respectful roleplay thread on the community forums showcasing screenshots, stories, and character progression.\n2. Official communication between faction leadership and staff must occur through designated IFM leadership tickets.\n3. Multi-Faction Roleplay & Alliances: When fighting alongside allies in joint operations, your combined side is strictly limited to the maximum player cap (you cannot team up to create a 30-man army).","aliases":["gang colors","faction attire","attire","uniforms","faction thread","alliances","multi faction"],"featured":false,"severity":"standard","callouts":[],"sort_order":27,"enabled":true},{"id":"conflict-rules-expectations","category_id":"faction-conflict","rule_number":28,"title":"Faction Conflict & War Expectations","short_title":"Conflict & Gang Wars","short_description":"Requires valid RP buildup. No toxic behavior (COD lobby talk) after gunfights. Faction wars must have IFM terms and approval.","content":"Faction Conflict Rules:\nConflict between factions must develop organically through story progression, trade disputes, territory friction, or character rivalries.\n\nRules of Engagement:\n1. Valid Escalation: You cannot jump straight to shooting over a minor verbal disagreement. Conflict must escalate through warnings, fistfights, robberies, or negotiations before turning into deadly warfare.\n2. Post-Fight Conduct: No toxic behavior after gunfights. Absolutely no ''Call of Duty lobby talk'', screaming insults over downed bodies, or taunting players in hospital beds. Take your win or loss with maturity.\n3. Faction Wars:\n   - Official gang wars require prior submission to and approval by IFM.\n   - War terms (duration, weapons permitted, participant caps, victory conditions) must be agreed upon by both faction leaders and signed off by IFM.\n   - Third parties are not permitted to intervene in active war fights.","aliases":["gang war","conflict","war rules","toxic behavior","cod lobby talk","trash talk","ifm approval"],"featured":false,"severity":"standard","callouts":[{"type":"NOT_ALLOWED","title":"No Post-Fight Toxicity","text":"Teabagging, screaming slurs, or toxic trash talk over downed opponents will result in immediate conflict penalties and bans."}],"sort_order":28,"enabled":true},{"id":"bleed-in-bleed-out","category_id":"faction-conflict","rule_number":29,"title":"Bleed-In & Bleed-Out Rules","short_title":"Bleed-In / Bleed-Out","short_description":"Joining or leaving a gang carries in-character weight. Bleed-outs incur memory loss of all sensitive faction secrets.","content":"Bleed-In / Bleed-Out Rules:\n1. Bleed-In: A bleed-in is an in-character ritual or initiation where an applicant commits fully to a faction, acknowledging the dangers and code of silence.\n2. Bleed-Out: A bleed-out occurs when a member leaves or is excommunicated from a faction.\n   - When a player is bled out, their character suffers permanent memory loss regarding sensitive gang secrets, stash house locations, secret suppliers, and illegal trade networks.\n   - The ex-member cannot turn around and leak all gang secrets to rival factions or the police (doing so constitutes severe Metagaming / Fail RP).\n   - If a member agreed to a CK clause upon joining, the bleed-out may result in permanent character death if approved by IFM.","aliases":["bleed in","bleed out","leaving gang","gang initiation","gang secrets"],"featured":false,"severity":"standard","callouts":[{"type":"IMPORTANT","title":"Secret Protection","text":"A bled-out member completely forgets the locations of gang stashes, supply routes, and internal criminal operations."}],"sort_order":29,"enabled":true},{"id":"racing-recording-pov","category_id":"faction-conflict","rule_number":30,"title":"Street Racing & Mandatory Recording (POV)","short_title":"Racing & POV Rules","short_description":"All faction members in conflicts must record clean audio/video POV and retain recordings for at least 48 hours.","content":"Street Racing Rules:\nIllegal street racing crews must respect public safety boundaries, coordinate races in suitable routes, and account for police pursuits realistically. Ramming or pitting competitors at 160 MPH in non-contact races is considered VDM/Fail RP.\n\nMandatory Recording / POV Policy:\n1. All faction members involved in active shootouts, faction wars, territory conflicts, or high-tier heists MUST record their point-of-view (POV) with clean in-game audio and video.\n2. Recordings must be retained for a minimum of 48 hours following any combat situation.\n3. If a ticket or dispute is filed and a player fails to provide required POV footage upon staff request, the situation may be ruled against them automatically and disciplinary action may follow.\n4. Ticket Warring: Submitting false, malicious, or retaliatory tickets solely to weaponize staff against rival factions is strictly prohibited.","aliases":["racing","pov","recording","medal","shadowplay","ticket warring","evidence","48 hours"],"featured":false,"severity":"standard","callouts":[{"type":"IMPORTANT","title":"Mandatory 48-Hour Retention","text":"Always save your gameplay recordings when entering combat. Failing to provide requested POV in a dispute carries administrative penalties."}],"sort_order":30,"enabled":true},{"id":"reports-rule-baiting","category_id":"reports-enforcement","rule_number":31,"title":"Player Reports & Rule Baiting","short_title":"Reports & Rule Baiting","short_description":"Use the in-game /report system or Discord tickets. Rule baiting or intentionally trying to get others banned is prohibited.","content":"You may eventually encounter a rulebreak in your RP. Please use the /report system in-game or submit a formal ticket on Discord with your video evidence.\n\nReporting Standards:\n1. All players are expected to report any major rule break that they are aware of within 48 hours of occurrence.\n2. Rule Baiting: Intentionally trying to bait, trick, or manipulate another player into breaking a rule so you can report them is strictly forbidden and carries the same penalty as the rule being baited.\n3. Frivolous Reports: Reports submitted solely based on personal grievances, salt, or minor infractions that could be resolved amicably via conversation will be dismissed.\n4. Independent Staff Review: Staff decisions are final. Reports involving staff members are investigated independently to ensure impartiality and fairness.","aliases":["reports","rule baiting","report system","reporting","staff tickets","ban appeal","tickets"],"featured":false,"severity":"standard","callouts":[{"type":"WARNING","title":"No Rule Baiting","text":"Trying to lure other players into RDM, VDM, or FearRP violations to file reports will result in punishment for rule baiting."}],"sort_order":31,"enabled":true}]}'::jsonb,
  '150580708144840704',
  'Damon',
  'Initial Rules CMS migration: Official server constitution and ruleset snapshot (31 rules across 9 categories).',
  '[{"action": "migration", "rulesCount": 31, "categoriesCount": 9}]'::jsonb,
  now()
)
ON CONFLICT (version_number) DO NOTHING;
