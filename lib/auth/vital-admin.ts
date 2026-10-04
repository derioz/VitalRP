import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  SUPER_ADMIN_DISCORD_ID,
  isSuperAdmin,
  isKnownAdmin,
  getAllPermissions,
  AppPermission,
} from './permissions';

export const VITAL_GUILD_ID = process.env.DISCORD_GUILD_ID || '730015674348601384';
export const VITAL_ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID || '733091115577901158';
export const VITAL_WHITELIST_ROLE_ID = process.env.DISCORD_WHITELIST_ROLE_ID || '1241050651677556806';

export const KNOWN_WHITELIST_ROLE_IDS = new Set<string>([
  '1241050651677556806', // Whitelist Approved
  '1315051212072161340', // Whitelist Team
  '1392591587434955015', // Pre-whitelisted faction member
  '1241050904887824444', // Expedited Whitelist Apps
]);

export function isWhitelistApproved(roles: string[]): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some(
    (r) =>
      KNOWN_WHITELIST_ROLE_IDS.has(r) ||
      r === VITAL_WHITELIST_ROLE_ID ||
      (typeof r === 'string' && /whitelist/i.test(r))
  );
}

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
    id: '1251959011872342057',
    name: 'Head Administrator',
    priority: 1,
    color: '#038388',
    badgeClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    borderClass: 'border-cyan-500/40',
  },
  {
    id: '733090996660863056',
    name: 'Senior Administrator',
    priority: 2,
    color: '#ef4444',
    badgeClass: 'bg-red-500/10 border-red-500/30 text-red-400',
    borderClass: 'border-red-500/40',
  },
  {
    id: '733091115577901158',
    name: 'Administrator',
    priority: 3,
    color: '#f97316',
    badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    borderClass: 'border-orange-500/40',
  },
  {
    id: '1256346822914347170',
    name: 'Senior Moderator',
    priority: 4,
    color: '#8b5cf6',
    badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    borderClass: 'border-purple-500/40',
  },
  {
    id: '733091376832708689',
    name: 'Moderator',
    priority: 5,
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    borderClass: 'border-blue-500/40',
  },
  {
    id: '733091380540473384',
    name: 'Support Staff',
    priority: 6,
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
 * using strict priority ordering (Head Admin -> Senior Admin -> Admin -> Senior Mod -> Moderator -> Support Staff).
 */
export function resolveStaffRoles(roleIdsOrNames: string[], discordId?: string | null): {
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

  const matched = RECOGNIZED_STAFF_ROLES.filter(
    (r) => roleIdsOrNames.includes(r.id) || roleIdsOrNames.includes(r.name)
  );
  if (matched.length === 0) {
    return {
      primaryRole: '',
      recognizedRoles: [],
      otherRoles: [],
      isStaff: false,
    };
  }

  // Sort ascending by priority number: 1 = Head Admin, 2 = Senior Admin, 3 = Admin, 4 = Senior Mod, 5 = Mod, 6 = Support
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
    const baseWikiPerms: AppPermission[] = ['wiki.view', 'wiki.create', 'wiki.edit', 'wiki.upload'];
    return {
      discordId: discordId || '',
      isSuperAdmin: false,
      isAdmin: false,
      role: 'user',
      permissions: baseWikiPerms,
      discordRoles: [],
      roleBreakdown: baseWikiPerms.reduce((acc, p) => {
        acc[p] = ['Authenticated Member'];
        return acc;
      }, {} as Record<string, string[]>),
      matchedRoleNames: ['Member'],
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

  // Fallback for all known synced admins if Discord member fetch is offline or rate-limited
  if (isKnownAdmin(discordId) && !memberRoles.includes(VITAL_ADMIN_ROLE_ID)) {
    memberRoles.push(VITAL_ADMIN_ROLE_ID);
  }

  const supabase = createAdminClient();

  // Fallback if live Discord member fetch returned empty (e.g. rate limit):
  // Check if user has an active staff_members record in Supabase with last_known_roles
  if (memberRoles.length === 0 && supabase) {
    try {
      const { data: staffRec } = await supabase
        .from('staff_members')
        .select('last_known_roles, active')
        .eq('discord_user_id', discordId)
        .maybeSingle();

      if (staffRec && staffRec.active && Array.isArray(staffRec.last_known_roles)) {
        for (const roleName of staffRec.last_known_roles) {
          const foundDef = RECOGNIZED_STAFF_ROLES.find((r) => r.name === roleName);
          if (foundDef && !memberRoles.includes(foundDef.id)) {
            memberRoles.push(foundDef.id);
          }
        }
      }
    } catch {
      // Ignore fallback read errors
    }
  }

  // Calculate staff role priority (Head Admin -> Senior Admin -> Admin -> Senior Mod -> Moderator -> Support Staff)
  const staffRoleRes = resolveStaffRoles(memberRoles, discordId);

  // 3. Fetch role mappings and permissions from Supabase
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
          const isUserMatch = mapping.discord_role_id === `user:${discordId}` || mapping.discord_role_id === discordId;
          if (memberRoles.includes(mapping.discord_role_id) || isUserMatch) {
            matchedRoleNames.push(mapping.discord_role_name);
            const perms = (mapping.discord_role_permissions as any[]) || [];
            for (const p of perms) {
              const permKey = p.permission as AppPermission;
              permissionsSet.add(permKey);
              if (!roleBreakdown[permKey]) {
                roleBreakdown[permKey] = [];
              }
              const sourceLabel = isUserMatch ? 'Custom Staff Override' : mapping.discord_role_name;
              if (!roleBreakdown[permKey].includes(sourceLabel)) {
                roleBreakdown[permKey].push(sourceLabel);
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

  // Authoritative Whitelist Role Check:
  if (isWhitelistApproved(memberRoles)) {
    if (!matchedRoleNames.includes('Whitelist Approved')) {
      matchedRoleNames.push('Whitelist Approved');
    }
  }

  // All authenticated community members can view the wiki, create characters, edit characters they own, and upload wiki images
  const baseWikiPerms: AppPermission[] = ['wiki.view', 'wiki.create', 'wiki.edit', 'wiki.upload'];
  for (const p of baseWikiPerms) {
    permissionsSet.add(p);
  }

  const permissions = Array.from(permissionsSet);
  const isAdmin = permissions.includes('admin.access') || staffRoleRes.isStaff || isKnownAdmin(discordId);
  const role = staffRoleRes.primaryRole || (matchedRoleNames[0] || (isAdmin ? 'admin' : 'user'));

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
  // Head Admin (1251959011872342057)
  if (memberRoles.includes('1251959011872342057') || memberRoles.includes('Head Administrator')) {
    matchedRoleNames.push('Head Administrator');
    for (const p of getAllPermissions()) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      if (!roleBreakdown[p].includes('Head Administrator')) {
        roleBreakdown[p].push('Head Administrator');
      }
    }
  }

  // Senior Admin (733090996660863056)
  if (memberRoles.includes('733090996660863056') || memberRoles.includes('Senior Administrator')) {
    matchedRoleNames.push('Senior Administrator');
    for (const p of getAllPermissions()) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      if (!roleBreakdown[p].includes('Senior Administrator')) {
        roleBreakdown[p].push('Senior Administrator');
      }
    }
  }

  // Administrator (733091115577901158)
  if (memberRoles.includes('733091115577901158') || memberRoles.includes('Administrator')) {
    matchedRoleNames.push('Administrator');
    const adminPerms: AppPermission[] = [
      'admin.access',
      'rules.view',
      'rules.edit',
      'rules.publish',
      'rules.history',
      'staff.view',
      'staff.manage',
      'audit.view',
      'settings.manage',
      'merch.view',
      'merch.manage',
      'wiki.view',
      'wiki.create',
      'wiki.edit',
      'wiki.upload',
      'wiki.moderate',
    ];
    for (const p of adminPerms) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      if (!roleBreakdown[p].includes('Administrator')) {
        roleBreakdown[p].push('Administrator');
      }
    }
  }

  // Senior Moderator (1256346822914347170)
  if (memberRoles.includes('1256346822914347170') || memberRoles.includes('Senior Moderator')) {
    matchedRoleNames.push('Senior Moderator');
    const srModPerms: AppPermission[] = [
      'admin.access',
      'rules.view',
      'rules.history',
      'staff.view',
      'wiki.view',
      'wiki.create',
      'wiki.edit',
      'wiki.upload',
      'wiki.moderate',
    ];
    for (const p of srModPerms) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      if (!roleBreakdown[p].includes('Senior Moderator')) {
        roleBreakdown[p].push('Senior Moderator');
      }
    }
  }

  // Moderator (733091376832708689)
  if (memberRoles.includes('733091376832708689') || memberRoles.includes('Moderator')) {
    matchedRoleNames.push('Moderator');
    const modPerms: AppPermission[] = [
      'admin.access',
      'rules.view',
      'rules.history',
      'wiki.view',
      'wiki.create',
      'wiki.edit',
      'wiki.upload',
    ];
    for (const p of modPerms) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      if (!roleBreakdown[p].includes('Moderator')) {
        roleBreakdown[p].push('Moderator');
      }
    }
  }

  // Support Staff (733091380540473384)
  if (memberRoles.includes('733091380540473384') || memberRoles.includes('Support Staff')) {
    matchedRoleNames.push('Support Staff');
    const supPerms: AppPermission[] = [
      'admin.access',
      'rules.view',
      'wiki.view',
      'wiki.create',
      'wiki.edit',
      'wiki.upload',
    ];
    for (const p of supPerms) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      if (!roleBreakdown[p].includes('Support Staff')) {
        roleBreakdown[p].push('Support Staff');
      }
    }
  }

  // Whitelist Approved Role Check
  if (isWhitelistApproved(memberRoles)) {
    if (!matchedRoleNames.includes('Whitelist Approved')) {
      matchedRoleNames.push('Whitelist Approved');
    }
    const wlPerms: AppPermission[] = ['wiki.view', 'wiki.create', 'wiki.edit', 'wiki.upload'];
    for (const p of wlPerms) {
      permissionsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      if (!roleBreakdown[p].includes('Whitelist Approved')) {
        roleBreakdown[p].push('Whitelist Approved');
      }
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
            last_known_roles: ['Super Admin', 'Senior Administrator', 'Administrator'],
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
            last_known_roles: ['Super Admin', 'Senior Administrator', 'Administrator'],
            first_admin_login: new Date().toISOString(),
            last_admin_login: new Date().toISOString(),
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      // Ensure profile role is owner
      await supabase
        .from('profiles')
        .update({ role: 'owner', updated_at: new Date().toISOString() })
        .eq('discord_id', discordId);

      return { isStaff: true, primaryRole: 'Super Admin', active: true };
    }

    // 2. Fetch live Discord member info if not provided
    const member = providedMemberInfo || (await fetchDiscordMember(discordId));
    const memberRoles = member?.roles || [];

    // Fallback for all known synced admins if Discord member fetch is offline or rate-limited
    if (isKnownAdmin(discordId) && !memberRoles.includes(VITAL_ADMIN_ROLE_ID)) {
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
      ? `https://cdn.discordapp.com/avatars/${discordId}/${member.user.avatar}${
          member.user.avatar.startsWith('a_') ? '.gif' : '.png'
        }`
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
      .select('id, first_admin_login, active, discord_username, discord_display_name, discord_avatar')
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
            last_known_roles: recognizedRoles,
            first_admin_login: new Date().toISOString(),
            last_admin_login: new Date().toISOString(),
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      // Auto-promote in profiles table to admin for console access
      const isAdminTier = ['Head Administrator', 'Senior Administrator', 'Administrator'].includes(primaryRole);
      if (isAdminTier) {
        await supabase
          .from('profiles')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('discord_id', discordId);
      }

      return { isStaff: true, primaryRole, active: true };
    } else {
      // If live Discord member fetch failed (network error or rate limit), NEVER deactivate existing staff
      if (!member && !providedMemberInfo && existingRecord) {
        return { isStaff: true, primaryRole: (existingRecord as any).last_known_roles?.[0] || 'Staff', active: existingRecord.active };
      }

      // If user is a known admin, never mark them inactive
      if (isKnownAdmin(discordId)) {
        return { isStaff: true, primaryRole: 'Administrator', active: true };
      }

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

export interface SyncedStaffSummary {
  discordId: string;
  username: string;
  displayName: string;
  avatar: string;
  primaryRole: string;
  recognizedRoles: string[];
  isAdmin: boolean;
}

export interface SyncRosterResult {
  success: boolean;
  totalScanned: number;
  totalStaff: number;
  seniorAdminsAndAdmins: number;
  syncedStaff: SyncedStaffSummary[];
  error?: string;
}

/**
 * Authoritative Discord Staff Roster Pull & Perms Synchronization.
 * Scans the entire Vital RP Discord Guild, pulls all members holding staff roles
 * (prioritizing Senior Admins, Admins, and Head Admins), grants them console access perms,
 * syncs their records in Supabase staff_members and profiles, and deactivates former staff.
 */
export async function syncDiscordStaffRoster(): Promise<SyncRosterResult> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return {
      success: false,
      totalScanned: 0,
      totalStaff: 0,
      seniorAdminsAndAdmins: 0,
      syncedStaff: [],
      error: 'DISCORD_BOT_TOKEN is missing or not configured.',
    };
  }

  const supabase = createAdminClient();
  const staffRoleIds = RECOGNIZED_STAFF_ROLES.map((r) => r.id);
  const allFoundMembers: DiscordMemberInfo[] = [];
  let after = '0';
  let totalScanned = 0;

  try {
    while (true) {
      const url = `https://discord.com/api/v10/guilds/${VITAL_GUILD_ID}/members?limit=1000${
        after !== '0' ? `&after=${after}` : ''
      }`;
      const res = await fetch(url, {
        headers: { Authorization: `Bot ${botToken}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[VitalAuth] Error fetching Discord guild members: ${res.status} ${errText}`);
        break;
      }

      const batch: DiscordMemberInfo[] = await res.json();
      if (!batch || batch.length === 0) break;

      totalScanned += batch.length;
      for (const m of batch) {
        const hasStaffRole = (m.roles || []).some((r) => staffRoleIds.includes(r));
        const isSuper = m.user?.id === SUPER_ADMIN_DISCORD_ID;
        if (hasStaffRole || isSuper) {
          allFoundMembers.push(m);
        }
      }

      after = batch[batch.length - 1].user?.id || '';
      if (batch.length < 1000 || !after) break;
    }

    // Always guarantee Damon is present in the staff pool
    const hasDamon = allFoundMembers.some((m) => m.user?.id === SUPER_ADMIN_DISCORD_ID);
    if (!hasDamon) {
      allFoundMembers.unshift({
        roles: ['733090996660863056', '733091115577901158'],
        user: {
          id: SUPER_ADMIN_DISCORD_ID,
          username: 'damon',
          discriminator: '0',
          avatar: 'bedf3166ac36aa21047fee8c77d94c26',
          global_name: 'Damon',
        },
        nick: 'damon',
      });
    }

    const syncedStaffList: SyncedStaffSummary[] = [];
    const activeStaffIds = new Set<string>();
    let seniorAdminsAndAdminsCount = 0;

    for (const m of allFoundMembers) {
      const discordId = m.user?.id;
      if (!discordId) continue;

      activeStaffIds.add(discordId);
      const isSuper = isSuperAdmin(discordId);
      const { primaryRole, recognizedRoles } = resolveStaffRoles(m.roles || [], discordId);

      const displayName =
        m.nick || m.user?.global_name || m.user?.username || 'Staff Member';
      const username = m.user?.username || 'staff';
      const avatarUrl = m.user?.avatar
        ? `https://cdn.discordapp.com/avatars/${discordId}/${m.user.avatar}${
            m.user.avatar.startsWith('a_') ? '.gif' : '.png'
          }`
        : '';

      const isAdminTier =
        isSuper ||
        ['Head Administrator', 'Senior Administrator', 'Administrator'].includes(primaryRole);

      if (isAdminTier) {
        seniorAdminsAndAdminsCount++;
      }

      syncedStaffList.push({
        discordId,
        username,
        displayName,
        avatar: avatarUrl,
        primaryRole,
        recognizedRoles,
        isAdmin: isAdminTier,
      });

      if (supabase) {
        // Upsert into staff_members table
        await supabase
          .from('staff_members')
          .upsert(
            {
              discord_user_id: discordId,
              discord_username: username,
              discord_display_name: displayName,
              discord_avatar: avatarUrl,
              last_known_roles: recognizedRoles,
              active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'discord_user_id' }
          );

        // Auto-promote in profiles table to admin for console access
        if (isAdminTier) {
          await supabase
            .from('profiles')
            .update({
              role: isSuper ? 'owner' : 'admin',
              updated_at: new Date().toISOString(),
            })
            .eq('discord_id', discordId);
        }
      }
    }

    // Former staff cleanup: Any previously active staff member in DB no longer in guild staff roles
    if (supabase) {
      const { data: dbStaff } = await supabase
        .from('staff_members')
        .select('discord_user_id, active')
        .eq('active', true);

      if (dbStaff) {
        for (const existing of dbStaff) {
          if (
            existing.discord_user_id !== SUPER_ADMIN_DISCORD_ID &&
            !activeStaffIds.has(existing.discord_user_id)
          ) {
            await supabase
              .from('staff_members')
              .update({
                active: false,
                updated_at: new Date().toISOString(),
              })
              .eq('discord_user_id', existing.discord_user_id);
          }
        }
      }
    }

    // Invalidate role cache so all active sessions update immediately
    invalidateRoleCache();

    return {
      success: true,
      totalScanned,
      totalStaff: syncedStaffList.length,
      seniorAdminsAndAdmins: seniorAdminsAndAdminsCount,
      syncedStaff: syncedStaffList,
    };
  } catch (error: any) {
    console.error('[VitalAuth] Error in syncDiscordStaffRoster:', error);
    return {
      success: false,
      totalScanned,
      totalStaff: 0,
      seniorAdminsAndAdmins: 0,
      syncedStaff: [],
      error: error.message || 'Failed to sync staff roster',
    };
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

/**
 * Fast in-memory enrichment of staff records for Staff Management UI.
 * Avoids sequential Discord API rate limits by reading saved last_known_roles
 * and role mappings from the database.
 */
export async function enrichStaffRoster(staffList: any[], supabase?: any) {
  // Ensure Damon (Super Admin) is always in the staff list
  const hasDamon = staffList.some((s) => s.discord_user_id === SUPER_ADMIN_DISCORD_ID);
  if (!hasDamon) {
    staffList.unshift({
      id: 'super-admin-damon',
      discord_user_id: SUPER_ADMIN_DISCORD_ID,
      discord_username: 'damon',
      discord_display_name: 'Damon',
      discord_avatar: 'https://cdn.discordapp.com/avatars/150580708144840704/bedf3166ac36aa21047fee8c77d94c26.png',
      primary_role: 'Super Admin',
      recognized_roles: ['Super Admin'],
      last_known_roles: ['Super Admin', 'Senior Administrator', 'Administrator'],
      first_admin_login: new Date('2026-09-01T00:00:00Z').toISOString(),
      last_admin_login: new Date().toISOString(),
      active: true,
    });
  }

  // Pre-load role permissions and user permission overrides map from Supabase
  const rolePermissionsMap = new Map<string, string[]>();
  const userPermissionsMap = new Map<string, string[]>();
  if (supabase) {
    try {
      const { data: mappings } = await supabase
        .from('discord_role_mappings')
        .select(`
          discord_role_id,
          discord_role_name,
          discord_role_permissions (
            permission
          )
        `)
        .eq('enabled', true);

      if (mappings) {
        for (const m of mappings) {
          const perms = (m.discord_role_permissions as any[])?.map((p: any) => p.permission) || [];
          rolePermissionsMap.set(m.discord_role_name, perms);
          if (m.discord_role_id?.startsWith('user:')) {
            const uid = m.discord_role_id.replace('user:', '');
            userPermissionsMap.set(uid, perms);
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  return staffList.map((member) => {
    const isSuper = member.discord_user_id === SUPER_ADMIN_DISCORD_ID;
    if (isSuper) {
      const allPerms = getAllPermissions();
      return {
        ...member,
        isSuperAdmin: true,
        primary_role: 'Super Admin',
        recognized_roles: ['Super Admin'],
        other_roles: [],
        active: true,
        effectivePermissions: allPerms,
        roleBreakdown: allPerms.reduce((acc, p) => {
          acc[p] = ['Super Admin Authority'];
          return acc;
        }, {} as Record<string, string[]>),
        matchedRoleNames: ['Super Admin'],
        discordRoles: [],
      };
    }

    const rolesToCheck = Array.isArray(member.last_known_roles) ? member.last_known_roles : [];
    const roleRes = resolveStaffRoles(rolesToCheck, member.discord_user_id);
    const isCurrentlyActive = Boolean(member.active) && (roleRes.isStaff || isKnownAdmin(member.discord_user_id));

    // Aggregate permissions from recognized roles
    const permsSet = new Set<string>();
    const roleBreakdown: Record<string, string[]> = {};
    for (const rName of roleRes.recognizedRoles) {
      const perms = rolePermissionsMap.get(rName) || [];
      for (const p of perms) {
        permsSet.add(p);
        roleBreakdown[p] = roleBreakdown[p] || [];
        if (!roleBreakdown[p].includes(rName)) {
          roleBreakdown[p].push(rName);
        }
      }
    }

    // Default admin permissions for recognized admin roles or known admins
    if (isKnownAdmin(member.discord_user_id) || ['Head Administrator', 'Senior Administrator', 'Administrator'].includes(roleRes.primaryRole)) {
      permsSet.add('admin.access');
      permsSet.add('staff.view');
      permsSet.add('rules.view');
    }

    // Custom user permissions from user-specific role mapping
    const customUserPerms = userPermissionsMap.get(member.discord_user_id) || [];
    for (const p of customUserPerms) {
      permsSet.add(p);
      roleBreakdown[p] = roleBreakdown[p] || [];
      if (!roleBreakdown[p].includes('Custom Override')) {
        roleBreakdown[p].push('Custom Override');
      }
    }

    // Custom permissions embedded in last_known_roles as perm: tokens
    for (const item of rolesToCheck) {
      if (typeof item === 'string' && item.startsWith('perm:')) {
        const perm = item.replace('perm:', '');
        permsSet.add(perm);
        roleBreakdown[perm] = roleBreakdown[perm] || [];
        if (!roleBreakdown[perm].includes('Staff Override')) {
          roleBreakdown[perm].push('Staff Override');
        }
      }
    }

    return {
      ...member,
      isSuperAdmin: false,
      primary_role: roleRes.primaryRole || (isCurrentlyActive ? 'Staff' : 'Former Staff'),
      recognized_roles: roleRes.recognizedRoles,
      other_roles: roleRes.otherRoles || [],
      active: isCurrentlyActive,
      effectivePermissions: Array.from(permsSet),
      roleBreakdown,
      matchedRoleNames: roleRes.recognizedRoles.length > 0 ? roleRes.recognizedRoles : ['Staff'],
      discordRoles: [],
    };
  });
}
