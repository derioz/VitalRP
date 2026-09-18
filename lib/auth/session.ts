import { createClient as createServerClientInstance } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/client';
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

/**
 * Robust Discord ID extractor from Supabase user object.
 * Strictly verifies the ID is a numeric Discord snowflake (17-20 digits).
 * Checks all known provider data fields, identities, and metadata.
 */
export function extractDiscordId(user: any): string | null {
  if (!user) return null;

  // Helper validator
  const isSnowflake = (val: any): val is string =>
    typeof val === 'string' && /^\d{17,20}$/.test(val);

  // 1. Check user.identities for provider 'discord'
  if (Array.isArray(user.identities) && user.identities.length > 0) {
    const discordIdentity = user.identities.find((i: any) => i.provider === 'discord');
    if (discordIdentity) {
      const idData = discordIdentity.identity_data;
      if (idData) {
        if (isSnowflake(idData.id)) return idData.id;
        if (isSnowflake(idData.provider_id)) return idData.provider_id;
        if (isSnowflake(idData.sub)) return idData.sub;
      }
      if (isSnowflake(discordIdentity.id)) {
        return discordIdentity.id;
      }
    }
  }

  // 2. Check user.user_metadata
  const meta = user.user_metadata;
  if (meta) {
    if (isSnowflake(meta.provider_id)) return meta.provider_id;
    if (isSnowflake(meta.sub)) return meta.sub;
    if (isSnowflake(meta.id)) return meta.id;
    if (meta.custom_claims) {
      if (isSnowflake(meta.custom_claims.id)) return meta.custom_claims.id;
      if (isSnowflake(meta.custom_claims.sub)) return meta.custom_claims.sub;
    }
  }

  // 3. Check app_metadata provider
  const appMeta = user.app_metadata;
  if (appMeta?.provider === 'discord' && isSnowflake(appMeta.provider_id)) {
    return appMeta.provider_id;
  }

  return null;
}

/**
 * Get current Supabase session and authoritative Discord Admin status in server components and routes.
 * Supports both:
 * - Bearer token header (passed from client fetch calls)
 * - Server cookie session (passed on direct navigation / SSR)
 */
export async function getCurrentSession(token?: string): Promise<SessionUser | null> {
  try {
    let user: any = null;

    // 1. Authenticate via Bearer token if provided by client
    if (token) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data, error } = await adminClient.auth.getUser(token);
        if (!error && data?.user) {
          user = data.user;
        }
      }
      if (!user) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
        const anonClient = createSupabaseJsClient(url, anonKey);
        const { data, error } = await anonClient.auth.getUser(token);
        if (!error && data?.user) {
          user = data.user;
        }
      }
    }

    // 2. Authenticate via Server cookies if no user resolved yet
    if (!user) {
      try {
        const supabase = await createServerClientInstance();
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          user = data.user;
        }
      } catch (cookieErr) {
        // Can fail if cookies() is called outside request scope
      }
    }

    if (!user) {
      console.log('[VitalAuth] getCurrentSession: No authenticated Supabase session found.');
      return null;
    }

    console.log(`[VitalAuth] Supabase User Authenticated: User ID = ${user.id}, Email = ${user.email || 'N/A'}`);

    // Extract Discord Snowflake ID
    const discordId = extractDiscordId(user) || '';
    console.log(`[VitalAuth] Extracted Discord User ID: "${discordId}" for Supabase User ${user.id}`);

    // Authoritative Server-Side Discord Admin Check
    const isAdmin = await isVitalAdmin(discordId);
    console.log(
      `[VitalAuth] Authorization Result for User "${user.user_metadata?.full_name || user.user_metadata?.name || user.id}" (Discord ID: ${discordId}): isAdmin = ${isAdmin}`
    );

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
    console.error('[VitalAuth] Error in getCurrentSession:', err);
    return null;
  }
}
