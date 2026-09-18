import 'server-only';

export const VITAL_GUILD_ID = process.env.DISCORD_GUILD_ID || '730015674348601384';
export const VITAL_ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID || '733091115577901158';

interface CacheEntry {
  isAdmin: boolean;
  roles: string[];
  timestamp: number;
}

// In-memory cache to prevent hitting Discord API rate-limits on every server request
const roleCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Server-side Discord Admin check.
 * Validates that the user is in the VitalRP Discord Guild (730015674348601384)
 * and holds the designated Admin Role (733091115577901158).
 */
export async function isVitalAdmin(discordId?: string | null): Promise<boolean> {
  if (!discordId) {
    return false;
  }

  // Check in-memory cache first
  const cached = roleCache.get(discordId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.isAdmin;
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn(
      '[VitalAuth] DISCORD_BOT_TOKEN is not configured. Admin authorization safely defaulted to false.'
    );
    return false;
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${VITAL_GUILD_ID}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        cache: 'no-store',
      }
    );

    if (res.status === 404) {
      // User is not a member of the VitalRP Discord
      roleCache.set(discordId, { isAdmin: false, roles: [], timestamp: Date.now() });
      return false;
    }

    if (!res.ok) {
      console.error(
        `[VitalAuth] Discord API returned status ${res.status} when querying member ${discordId}`
      );
      return false;
    }

    const member = await res.json();
    const roles: string[] = Array.isArray(member?.roles) ? member.roles : [];
    const hasAdminRole = roles.includes(VITAL_ADMIN_ROLE_ID);

    roleCache.set(discordId, {
      isAdmin: hasAdminRole,
      roles,
      timestamp: Date.now(),
    });

    return hasAdminRole;
  } catch (error) {
    console.error('[VitalAuth] Failed to verify Discord member roles:', error);
    return false;
  }
}

/**
 * Invalidate cache for a specific user (e.g. on logout or manual refresh).
 */
export function invalidateRoleCache(discordId?: string | null) {
  if (discordId) {
    roleCache.delete(discordId);
  }
}
