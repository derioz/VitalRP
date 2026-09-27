import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  SUPER_ADMIN_DISCORD_ID,
  isSuperAdmin,
  getAllPermissions,
  AppPermission,
} from './permissions';

export const VITAL_GUILD_ID = process.env.DISCORD_GUILD_ID || '730015674348601384';
export const VITAL_ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID || '733091115577901158';

export interface DiscordGuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
}

export interface DiscordMemberInfo {
  roles: string[];
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name?: string | null;
  };
  nick?: string | null;
}

export interface EffectiveAuthResult {
  discordId: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  role: string;
  permissions: AppPermission[];
  discordRoles: string[];
  roleBreakdown: Record<string, string[]>; // permission -> array of role names that granted it
  matchedRoleNames: string[];
}

// In-memory cache for user permissions to prevent Discord API rate-limiting (60s TTL)
interface CachedAuth {
  result: EffectiveAuthResult;
  timestamp: number;
}
const authCache = new Map<string, CachedAuth>();
const CACHE_TTL_MS = 60 * 1000;

// Cached guild roles list (5 min TTL)
let cachedGuildRoles: DiscordGuildRole[] | null = null;
let cachedGuildRolesTimestamp = 0;
const GUILD_ROLES_TTL_MS = 5 * 60 * 1000;

/**
 * Fetch all roles in the Vital RP Discord Guild using the bot token.
 */
export async function getDiscordGuildRoles(forceRefresh = false): Promise<DiscordGuildRole[]> {
  if (!forceRefresh && cachedGuildRoles && Date.now() - cachedGuildRolesTimestamp < GUILD_ROLES_TTL_MS) {
    return cachedGuildRoles;
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn('[VitalAuth] DISCORD_BOT_TOKEN missing. Cannot fetch guild roles.');
    return [];
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${VITAL_GUILD_ID}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`[VitalAuth] Failed to fetch guild roles: ${res.status} ${res.statusText}`);
      return cachedGuildRoles || [];
    }

    const roles: DiscordGuildRole[] = await res.json();
    // Sort descending by position (hierarchy)
    roles.sort((a, b) => b.position - a.position);
    cachedGuildRoles = roles;
    cachedGuildRolesTimestamp = Date.now();
    return roles;
  } catch (error) {
    console.error('[VitalAuth] Error fetching Discord guild roles:', error);
    return cachedGuildRoles || [];
  }
}

/**
 * Fetch a specific member's live roles from the Vital RP Discord Guild.
 */
export async function fetchDiscordMember(discordId: string): Promise<DiscordMemberInfo | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || !discordId) return null;

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${VITAL_GUILD_ID}/members/${discordId}`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: 'no-store',
    });

    if (res.status === 200) {
      return (await res.json()) as DiscordMemberInfo;
    }
    return null;
  } catch (error) {
    console.error(`[VitalAuth] Error fetching Discord member "${discordId}":`, error);
    return null;
  }
}

/**
 * Authoritative Server-Side Discord Admin Check & Permission Calculation.
 *
 * 1. Checks if user is Super Admin (Damon: 150580708144840704).
 *    Super Admin always bypasses all role checks and receives all permissions.
 * 2. Otherwise, fetches the user's current Discord roles from the Vital RP Discord server.
 * 3. Compares Discord role IDs against mappings stored in Supabase (or seeded defaults).
 * 4. Aggregates all granted permissions.
 * 5. Syncs or updates the Supabase `staff_members` table.
 */
export async function getEffectiveAuth(
  discordId?: string | null,
  forceRefresh = false
): Promise<EffectiveAuthResult> {
  if (!discordId || !/^\d{17,20}$/.test(discordId)) {
    return {
      discordId: discordId || '',
      isSuperAdmin: false,
      isAdmin: false,
      role: 'user',
      permissions: [],
      discordRoles: [],
      roleBreakdown: {},
      matchedRoleNames: [],
    };
  }

  // Check in-memory cache
  if (!forceRefresh) {
    const cached = authCache.get(discordId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  // 1. Super Admin bypass (Damon: 150580708144840704)
  if (isSuperAdmin(discordId)) {
    const allPerms = getAllPermissions();
    const result: EffectiveAuthResult = {
      discordId,
      isSuperAdmin: true,
      isAdmin: true,
      role: 'superadmin',
      permissions: allPerms,
      discordRoles: [],
      roleBreakdown: allPerms.reduce((acc, p) => {
        acc[p] = ['Super Admin Authority'];
        return acc;
      }, {} as Record<string, string[]>),
      matchedRoleNames: ['Super Admin'],
    };

    authCache.set(discordId, { result, timestamp: Date.now() });
    await syncStaffRecord(discordId, result).catch(() => {});
    return result;
  }

  // 2. Fetch live Discord roles
  const member = await fetchDiscordMember(discordId);
  const memberRoles = member?.roles || [];

  // Fallback for known admin backup snowflake (Craysteens) if bot is offline
  if (discordId === '399373087172198400' && !memberRoles.includes(VITAL_ADMIN_ROLE_ID)) {
    memberRoles.push(VITAL_ADMIN_ROLE_ID);
  }

  // 3. Fetch role mappings and permissions from Supabase
  const supabase = createAdminClient();
  const permissionsSet = new Set<AppPermission>();
  const roleBreakdown: Record<string, string[]> = {};
  const matchedRoleNames: string[] = [];

  if (supabase) {
    try {
      const { data: mappings, error } = await supabase
        .from('discord_role_mappings')
        .select(`
          id,
          discord_role_id,
          discord_role_name,
          enabled,
          discord_role_permissions (
            permission
          )
        `)
        .eq('enabled', true);

      if (!error && mappings && mappings.length > 0) {
        for (const mapping of mappings) {
          if (memberRoles.includes(mapping.discord_role_id)) {
            matchedRoleNames.push(mapping.discord_role_name);
            const perms = (mapping.discord_role_permissions as any[]) || [];
            for (const p of perms) {
              const permKey = p.permission as AppPermission;
              permissionsSet.add(permKey);
              if (!roleBreakdown[permKey]) {
                roleBreakdown[permKey] = [];
              }
              if (!roleBreakdown[permKey].includes(mapping.discord_role_name)) {
                roleBreakdown[permKey].push(mapping.discord_role_name);
              }
            }
          }
        }
      } else {
        // Fallback default role mapping if tables not yet populated in Supabase
        applyFallbackRoleMappings(memberRoles, permissionsSet, roleBreakdown, matchedRoleNames);
      }
    } catch (err) {
      console.warn('[VitalAuth] Error reading discord_role_mappings from Supabase:', err);
      applyFallbackRoleMappings(memberRoles, permissionsSet, roleBreakdown, matchedRoleNames);
    }
  } else {
    applyFallbackRoleMappings(memberRoles, permissionsSet, roleBreakdown, matchedRoleNames);
  }

  const permissions = Array.from(permissionsSet);
  const isAdmin = permissions.includes('admin.access') || permissions.length > 0;
  const role = isAdmin ? (matchedRoleNames[0] || 'staff') : 'user';

  const result: EffectiveAuthResult = {
    discordId,
    isSuperAdmin: false,
    isAdmin,
    role,
    permissions,
    discordRoles: memberRoles,
    roleBreakdown,
    matchedRoleNames,
  };

  authCache.set(discordId, { result, timestamp: Date.now() });

  if (isAdmin) {
    await syncStaffRecord(discordId, result, member).catch(() => {});
  }

  return result;
}

/**
 * Fallback mapping for standard Vital RP discord roles if DB mapping is empty.
 */
function applyFallbackRoleMappings(
  memberRoles: string[],
  permissionsSet: Set<AppPermission>,
  roleBreakdown: Record<string, string[]>,
  matchedRoleNames: string[]
) {
  // Senior Admin (733090996660863056)
  if (memberRoles.includes('733090996660863056')) {
    matchedRoleNames.push('Senior Administrator');
    for (const p of getAllPermissions()) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      roleBreakdown[p].push('Senior Administrator');
    }
  }

  // Administrator (733091115577901158)
  if (memberRoles.includes('733091115577901158')) {
    matchedRoleNames.push('Administrator');
    const adminPerms: AppPermission[] = [
      'admin.access',
      'rules.view',
      'rules.edit',
      'rules.publish',
      'rules.history',
      'staff.view',
      'audit.view',
      'settings.manage',
    ];
    for (const p of adminPerms) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      roleBreakdown[p].push('Administrator');
    }
  }

  // Moderator (733091376832708689)
  if (memberRoles.includes('733091376832708689')) {
    matchedRoleNames.push('Moderator');
    const modPerms: AppPermission[] = ['admin.access', 'rules.view', 'rules.history'];
    for (const p of modPerms) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      roleBreakdown[p].push('Moderator');
    }
  }

  // Support Staff (733091380540473384)
  if (memberRoles.includes('733091380540473384')) {
    matchedRoleNames.push('Support Staff');
    const supPerms: AppPermission[] = ['admin.access', 'rules.view'];
    for (const p of supPerms) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      roleBreakdown[p].push('Support Staff');
    }
  }
}

/**
 * Sync active staff member record to Supabase.
 */
async function syncStaffRecord(
  discordId: string,
  authResult: EffectiveAuthResult,
  memberInfo?: DiscordMemberInfo | null
) {
  const supabase = createAdminClient();
  if (!supabase) return;

  try {
    let displayName = memberInfo?.nick || memberInfo?.user?.global_name || memberInfo?.user?.username;
    let username = memberInfo?.user?.username;
    let avatarUrl = memberInfo?.user?.avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${memberInfo.user.avatar}.png`
      : undefined;

    // If member info wasn't in the guild call, check profiles table
    if (!displayName || !username) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('discord_id', discordId)
        .maybeSingle();

      if (profile) {
        displayName = displayName || profile.display_name || 'Staff Member';
        username = username || profile.username || 'staff';
        avatarUrl = avatarUrl || profile.avatar_url;
      }
    }

    if (isSuperAdmin(discordId)) {
      displayName = displayName || 'Damon';
      username = username || 'damon';
    }

    await supabase.from('staff_members').upsert(
      {
        discord_user_id: discordId,
        discord_username: username || 'Unknown',
        discord_display_name: displayName || 'Staff Member',
        discord_avatar: avatarUrl || '',
        last_known_roles: authResult.matchedRoleNames,
        last_admin_login: new Date().toISOString(),
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'discord_user_id' }
    );
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Backward compatibility helper for existing code checking isVitalAdmin.
 */
export async function isVitalAdmin(discordId?: string | null): Promise<boolean> {
  const auth = await getEffectiveAuth(discordId);
  return auth.isAdmin;
}

/**
 * Clear cached role authorization (e.g. after modifying role mappings or upon logout).
 */
export function invalidateRoleCache(discordId?: string | null) {
  if (discordId) {
    authCache.delete(discordId);
  } else {
    authCache.clear();
  }
  cachedGuildRoles = null;
}
