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

export interface RecognizedStaffRoleDef {
  id: string;
  name: string;
  priority: number; // 1 = Highest (Senior Admin -> Admin -> Mod -> Support Staff)
  color: string;
  badgeClass: string;
  borderClass: string;
}

/**
 * Recognized Vital RP staff roles and their hierarchical priority.
 * Priority: Senior Administrator (1) -> Administrator (2) -> Moderator (3) -> Support Staff (4)
 */
export const RECOGNIZED_STAFF_ROLES: readonly RecognizedStaffRoleDef[] = [
  {
    id: '733090996660863056',
    name: 'Senior Administrator',
    priority: 1,
    color: '#ef4444',
    badgeClass: 'bg-red-500/10 border-red-500/30 text-red-400',
    borderClass: 'border-red-500/40',
  },
  {
    id: '733091115577901158',
    name: 'Administrator',
    priority: 2,
    color: '#f97316',
    badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    borderClass: 'border-orange-500/40',
  },
  {
    id: '733091376832708689',
    name: 'Moderator',
    priority: 3,
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    borderClass: 'border-blue-500/40',
  },
  {
    id: '733091380540473384',
    name: 'Support Staff',
    priority: 4,
    color: '#10b981',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    borderClass: 'border-emerald-500/40',
  },
] as const;

export const RECOGNIZED_STAFF_ROLE_IDS = new Set<string>(
  RECOGNIZED_STAFF_ROLES.map((r) => r.id)
);

/**
 * Resolves a member's primary staff role and all held recognized staff roles
 * using strict priority ordering (Senior Admin -> Admin -> Moderator -> Support Staff).
 */
export function resolveStaffRoles(roleIds: string[], discordId?: string | null): {
  primaryRole: string;
  recognizedRoles: string[];
  otherRoles: string[];
  isStaff: boolean;
} {
  if (isSuperAdmin(discordId)) {
    return {
      primaryRole: 'Super Admin',
      recognizedRoles: ['Super Admin'],
      otherRoles: [],
      isStaff: true,
    };
  }

  const matched = RECOGNIZED_STAFF_ROLES.filter((r) => roleIds.includes(r.id));
  if (matched.length === 0) {
    return {
      primaryRole: '',
      recognizedRoles: [],
      otherRoles: [],
      isStaff: false,
    };
  }

  // Sort ascending by priority number: 1 = Senior Admin, 2 = Admin, 3 = Mod, 4 = Support
  matched.sort((a, b) => a.priority - b.priority);

  const primaryRole = matched[0].name;
  const recognizedRoles = matched.map((r) => r.name);
  const otherRoles = recognizedRoles.slice(1);

  return {
    primaryRole,
    recognizedRoles,
    otherRoles,
    isStaff: true,
  };
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
  primaryRole?: string;
  recognizedRoles?: string[];
  otherRoles?: string[];
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
      primaryRole: 'Super Admin',
      recognizedRoles: ['Super Admin'],
      otherRoles: [],
    };

    authCache.set(discordId, { result, timestamp: Date.now() });
    await syncStaffMemberOnLogin(discordId, null, null, result).catch(() => {});
    return result;
  }

  // 2. Fetch live Discord roles
  const member = await fetchDiscordMember(discordId);
  const memberRoles = member?.roles || [];

  // Fallback for known admin backup snowflake (Craysteens) if bot is offline
  if (discordId === '399373087172198400' && !memberRoles.includes(VITAL_ADMIN_ROLE_ID)) {
    memberRoles.push(VITAL_ADMIN_ROLE_ID);
  }

  // Calculate staff role priority (Senior Admin -> Admin -> Moderator -> Support Staff)
  const staffRoleRes = resolveStaffRoles(memberRoles, discordId);

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
  const isAdmin = permissions.includes('admin.access') || permissions.length > 0 || staffRoleRes.isStaff;
  const role = staffRoleRes.primaryRole || (matchedRoleNames[0] || (isAdmin ? 'staff' : 'user'));

  const result: EffectiveAuthResult = {
    discordId,
    isSuperAdmin: false,
    isAdmin,
    role,
    permissions,
    discordRoles: memberRoles,
    roleBreakdown,
    matchedRoleNames,
    primaryRole: staffRoleRes.primaryRole,
    recognizedRoles: staffRoleRes.recognizedRoles,
    otherRoles: staffRoleRes.otherRoles,
  };

  authCache.set(discordId, { result, timestamp: Date.now() });

  // Automatically sync staff member record in Supabase:
  // - If holding recognized roles: upserts active record with primary & recognized roles.
  // - If formerly staff without recognized roles: marks inactive while preserving history.
  // - If regular player: does not create an active staff record.
  await syncStaffMemberOnLogin(discordId, null, member, result).catch(() => {});

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
 * Authoritative Staff Member Synchronization.
 * Called automatically when any user logs in with Discord, completes OAuth,
 * or accesses staff-protected routes.
 *
 * Rules:
 * 1. Damon (150580708144840704) is permanent Super Admin: always active, never downgraded.
 * 2. If user holds at least one recognized Discord staff role:
 *    - Automatically creates or updates their record in `staff_members`.
 *    - Resolves primary role using priority: Senior Admin -> Admin -> Moderator -> Support Staff.
 *    - Sets `active = true`.
 * 3. If user previously had a staff record but no longer holds any recognized role:
 *    - Marks them `active = false` (inactive/former staff) to remove active access while preserving history.
 * 4. Regular players without staff history are NOT added to `staff_members`.
 */
export async function syncStaffMemberOnLogin(
  discordId: string,
  userMetadata?: any,
  providedMemberInfo?: DiscordMemberInfo | null,
  providedAuth?: EffectiveAuthResult | null
): Promise<{ isStaff: boolean; primaryRole: string; active: boolean }> {
  if (!discordId || !/^\d{17,20}$/.test(discordId)) {
    return { isStaff: false, primaryRole: '', active: false };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    const isSuper = isSuperAdmin(discordId);
    return {
      isStaff: isSuper,
      primaryRole: isSuper ? 'Super Admin' : '',
      active: isSuper,
    };
  }

  try {
    // 1. Permanent Super Admin protection (Damon: 150580708144840704)
    if (isSuperAdmin(discordId)) {
      const displayName =
        userMetadata?.custom_display_name ||
        userMetadata?.full_name ||
        userMetadata?.name ||
        'Damon';
      const username = userMetadata?.user_name || 'damon';
      const avatarUrl =
        userMetadata?.avatar_url ||
        userMetadata?.picture ||
        'https://cdn.discordapp.com/avatars/150580708144840704/bedf3166ac36aa21047fee8c77d94c26.png';

      const { data: existing } = await supabase
        .from('staff_members')
        .select('id, first_admin_login')
        .eq('discord_user_id', discordId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('staff_members')
          .update({
            discord_username: username,
            discord_display_name: displayName,
            discord_avatar: avatarUrl,
            primary_role: 'Super Admin',
            recognized_roles: ['Super Admin'],
            last_known_roles: ['Super Admin'],
            last_admin_login: new Date().toISOString(),
            active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('discord_user_id', discordId);
      } else {
        await supabase
          .from('staff_members')
          .insert({
            discord_user_id: discordId,
            discord_username: username,
            discord_display_name: displayName,
            discord_avatar: avatarUrl,
            primary_role: 'Super Admin',
            recognized_roles: ['Super Admin'],
            last_known_roles: ['Super Admin'],
            first_admin_login: new Date().toISOString(),
            last_admin_login: new Date().toISOString(),
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      return { isStaff: true, primaryRole: 'Super Admin', active: true };
    }

    // 2. Fetch live Discord member info if not provided
    const member = providedMemberInfo || (await fetchDiscordMember(discordId));
    const memberRoles = member?.roles || [];

    // Fallback for Craysteens safety net
    if (discordId === '399373087172198400' && !memberRoles.includes(VITAL_ADMIN_ROLE_ID)) {
      memberRoles.push(VITAL_ADMIN_ROLE_ID);
    }

    // 3. Resolve role hierarchy & priority
    const { primaryRole, recognizedRoles, otherRoles, isStaff } = resolveStaffRoles(memberRoles, discordId);

    // Extract profile details
    let displayName =
      member?.nick ||
      member?.user?.global_name ||
      member?.user?.username ||
      userMetadata?.custom_display_name ||
      userMetadata?.full_name ||
      userMetadata?.name;
    let username = member?.user?.username || userMetadata?.user_name;
    let avatarUrl = member?.user?.avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${member.user.avatar}.png`
      : userMetadata?.avatar_url || userMetadata?.picture || '';

    // Check profiles table if still missing
    if (!displayName || !username) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('discord_id', discordId)
        .maybeSingle();

      if (profile) {
        displayName = displayName || profile.display_name;
        username = username || profile.username;
        avatarUrl = avatarUrl || profile.avatar_url;
      }
    }

    displayName = displayName || 'Staff Member';
    username = username || 'staff';

    // 4. Check if a record already exists in staff_members
    const { data: existingRecord } = await supabase
      .from('staff_members')
      .select('id, first_admin_login, active, primary_role, recognized_roles, discord_username, discord_display_name, discord_avatar')
      .eq('discord_user_id', discordId)
      .maybeSingle();

    if (isStaff) {
      // User currently holds recognized Vital RP staff role(s)
      if (existingRecord) {
        // Returning staff member -> UPDATE record (preserve first_admin_login)
        await supabase
          .from('staff_members')
          .update({
            discord_username: username,
            discord_display_name: displayName,
            discord_avatar: avatarUrl || existingRecord.discord_avatar || '',
            primary_role: primaryRole,
            recognized_roles: recognizedRoles,
            last_known_roles: recognizedRoles,
            last_admin_login: new Date().toISOString(),
            active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('discord_user_id', discordId);
      } else {
        // Brand new staff member -> INSERT record
        await supabase
          .from('staff_members')
          .insert({
            discord_user_id: discordId,
            discord_username: username,
            discord_display_name: displayName,
            discord_avatar: avatarUrl || '',
            primary_role: primaryRole,
            recognized_roles: recognizedRoles,
            last_known_roles: recognizedRoles,
            first_admin_login: new Date().toISOString(),
            last_admin_login: new Date().toISOString(),
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      return { isStaff: true, primaryRole, active: true };
    } else {
      // User does NOT hold any recognized staff roles
      if (existingRecord) {
        // Formerly recognized staff member who lost their staff roles:
        // Mark inactive to remove website staff access while preserving history/audit references.
        await supabase
          .from('staff_members')
          .update({
            discord_username: username || existingRecord.discord_username || 'Unknown',
            discord_display_name: displayName || existingRecord.discord_display_name || 'Former Staff',
            discord_avatar: avatarUrl || existingRecord.discord_avatar || '',
            primary_role: 'Former Staff',
            recognized_roles: [],
            last_known_roles: [],
            last_admin_login: new Date().toISOString(),
            active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('discord_user_id', discordId);

        return { isStaff: false, primaryRole: 'Former Staff', active: false };
      }

      // Regular player who has never held a staff role -> Do NOT create a staff record
      return { isStaff: false, primaryRole: '', active: false };
    }
  } catch (err) {
    console.error(`[VitalAuth] Error syncing staff member "${discordId}":`, err);
    return { isStaff: false, primaryRole: '', active: false };
  }
}

/**
 * Backward compatibility alias for syncStaffMemberOnLogin.
 */
export async function syncStaffRecord(
  discordId: string,
  authResult: EffectiveAuthResult,
  memberInfo?: DiscordMemberInfo | null
) {
  return syncStaffMemberOnLogin(discordId, null, memberInfo, authResult);
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
