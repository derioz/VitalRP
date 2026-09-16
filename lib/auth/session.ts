import { createClient } from '@/lib/supabase/server';
import { Role, UserPermissions, getPermissions, normalizeRole } from './rbac';

export interface SessionUser {
  discordId: string;
  username: string;
  displayName: string;
  avatar: string;
  email?: string;
  role: Role;
  permissions: UserPermissions;
  expiresAt: number;
}

// Get current Supabase session and RBAC role in server components and routes
export async function getCurrentSession(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const discordId =
      user.user_metadata?.provider_id ||
      user.user_metadata?.sub ||
      user.identities?.find((i) => i.provider === 'discord')?.id ||
      '';

    // Auto-promote space (Discord ID: 150580708144840704) to owner
    let role: Role = discordId === '150580708144840704' ? 'owner' : 'user';

    let displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
    let username = user.user_metadata?.user_name || displayName;
    let avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

    // If not hardcoded owner, query database for custom assigned role
    if (role !== 'owner') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, display_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) role = normalizeRole(profile.role);
      if (profile?.display_name) displayName = profile.display_name;
      if (profile?.username) username = profile.username;
      if (profile?.avatar_url) avatar = profile.avatar_url;
    }

    const permissions = getPermissions(role);

    return {
      discordId,
      username,
      displayName,
      avatar,
      email: user.email,
      role,
      permissions,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
  } catch (err) {
    return null;
  }
}
