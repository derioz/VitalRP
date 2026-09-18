import { createClient } from '@/lib/supabase/server';
import { Role, UserPermissions, getPermissions } from './rbac';
import { isVitalAdmin } from './vital-admin';

export interface SessionUser {
  discordId: string;
  username: string;
  displayName: string;
  avatar: string;
  email?: string;
  role: Role;
  permissions: UserPermissions;
  isAdmin: boolean;
  expiresAt: number;
}

// Get current Supabase session and authoritative Discord Admin status in server components and routes
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

    // Verify admin access strictly server-side through Discord Guild & Role
    const isAdmin = await isVitalAdmin(discordId);
    const role: Role = isAdmin ? 'admin' : 'user';

    const displayName =
      user.user_metadata?.custom_display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      'User';
    const username = user.user_metadata?.user_name || displayName;
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

    const permissions = getPermissions(role);

    return {
      discordId,
      username,
      displayName,
      avatar,
      email: user.email,
      role,
      permissions,
      isAdmin,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
  } catch (err) {
    return null;
  }
}

