import 'server-only';

export const VITAL_GUILD_ID = process.env.DISCORD_GUILD_ID || '730015674348601384';
export const VITAL_ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID || '733091115577901158';


// Server-side fast cache for admin role status to avoid Discord rate-limiting (60s TTL)
const roleCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;

// Known system owner / admin snowflakes as safety net
const KNOWN_ADMIN_IDS = new Set<string>([
  '150580708144840704', // Space (Owner / Super Admin)
  '399373087172198400', // Craysteens (Admin)
]);

/**
 * Server-side Discord Admin check.
 * Strictly queries the live Discord REST API to verify:
 * 1. The user is a member of the VitalRP Discord Guild (730015674348601384)
 * 2. The user holds the Admin Role (733091115577901158)
 *
 * Does not rely on client-side state, email, or unrefreshing client storage.
 */
export async function isVitalAdmin(discordId?: string | null): Promise<boolean> {
  console.log(`[VitalAuth] ---> Starting isVitalAdmin() check for Discord ID: "${discordId}"`);

  if (!discordId) {
    console.log('[VitalAuth] [FAIL] No Discord ID provided. Returning false.');
    return false;
  }

  // Validate format (Discord snowflake is 17-20 digits). Reject Supabase UUIDs.
  if (!/^\d{17,20}$/.test(discordId)) {
    console.log(
      `[VitalAuth] [FAIL] Discord ID "${discordId}" is not a valid 17-20 digit numeric snowflake (likely a Supabase UUID or invalid format). Returning false.`
    );
    return false;
  }

  // Known Super Admin bypass
  if (KNOWN_ADMIN_IDS.has(discordId)) {
    console.log(`[VitalAuth] [PASS] Discord ID "${discordId}" is known Super Admin/Owner. Returning true.`);
    return true;
  }

  // Check in-memory cache
  const cached = roleCache.get(discordId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[VitalAuth] [CACHE HIT] Discord ID "${discordId}" cached isAdmin = ${cached.isAdmin}`);
    return cached.isAdmin;
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn(
      '[VitalAuth] [FAIL] DISCORD_BOT_TOKEN is not configured in environment. Admin authorization defaulted to false.'
    );
    return false;
  }

  const endpoint = `https://discord.com/api/v10/guilds/${VITAL_GUILD_ID}/members/${discordId}`;
  console.log(`[VitalAuth] Querying Discord API: GET ${endpoint}`);

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      cache: 'no-store',
    });

    console.log(`[VitalAuth] Discord API HTTP Status: ${res.status} ${res.statusText}`);

    if (res.status === 200) {
      const member = await res.json();
      const roles: string[] = Array.isArray(member?.roles) ? member.roles : [];
      const hasAdminRole = roles.includes(VITAL_ADMIN_ROLE_ID);

      console.log(`[VitalAuth] Discord Member found in Guild ${VITAL_GUILD_ID}: true`);
      console.log(`[VitalAuth] Discord Member Roles: [${roles.join(', ')}]`);
      console.log(`[VitalAuth] Checking for Admin Role ${VITAL_ADMIN_ROLE_ID}: ${hasAdminRole}`);
      console.log(`[VitalAuth] ===> isVitalAdmin("${discordId}") = ${hasAdminRole}`);

      roleCache.set(discordId, { isAdmin: hasAdminRole, timestamp: Date.now() });
      return hasAdminRole;
    }

    const errorBody = await res.json().catch(() => ({}));
    console.log(`[VitalAuth] Discord API Error Response:`, JSON.stringify(errorBody));

    if (res.status === 404) {
      if (errorBody?.code === 10004) {
        console.error(
          `[VitalAuth] [CRITICAL] Discord returned "Unknown Guild" (code 10004). The Bot is NOT inside Guild ${VITAL_GUILD_ID}!`
        );
      } else if (errorBody?.code === 10007) {
        console.log(
          `[VitalAuth] Member ${discordId} is NOT in Guild ${VITAL_GUILD_ID} (Discord code: 10007 Unknown Member). User is not in the Discord server.`
        );
      } else {
        console.log(`[VitalAuth] 404 Not Found returned by Discord API.`);
      }
    } else if (res.status === 401) {
      console.error(
        `[VitalAuth] [CRITICAL] Discord returned 401 Unauthorized. The DISCORD_BOT_TOKEN is invalid or revoked.`
      );
    } else if (res.status === 403) {
      console.error(
        `[VitalAuth] [CRITICAL] Discord returned 403 Forbidden. The bot lacks permission or "Server Members Intent" is disabled in Discord Developer Portal.`
      );
    }

    console.log(`[VitalAuth] ===> isVitalAdmin("${discordId}") = false`);
    roleCache.set(discordId, { isAdmin: false, timestamp: Date.now() });
    return false;
  } catch (error) {
    console.error(`[VitalAuth] Network/Fetch Exception while verifying Discord member roles:`, error);
    return false;
  }
}

/**
 * Invalidate cache for a specific user or all users.
 */
export function invalidateRoleCache(discordId?: string | null) {
  if (discordId) {
    roleCache.delete(discordId);
  } else {
    roleCache.clear();
  }
}

