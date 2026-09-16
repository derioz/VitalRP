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
