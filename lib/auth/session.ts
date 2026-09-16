import { cookies } from 'next/headers';
import { Role, UserPermissions, getPermissions, normalizeRole } from './rbac';

export const SESSION_COOKIE_NAME = 'vital_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

function getSecretKey(): string {
  const secret = process.env.SESSION_SECRET || 'fallback_development_secret_do_not_use_in_production_32chars';
  return secret;
}

// Convert string to Uint8Array
function stringToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert buffer to hex
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Web Crypto HMAC-SHA256 signature generator
async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    stringToBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, stringToBuffer(data));
  return bufferToHex(signature);
}

// Securely encode and sign payload
export async function createSessionToken(user: Omit<SessionUser, 'expiresAt' | 'permissions'>): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const role = normalizeRole(user.role);
  const permissions = getPermissions(role);

  const payload: SessionUser = {
    ...user,
    role,
    permissions,
    expiresAt,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = await sign(payloadBase64, getSecretKey());

  return `${payloadBase64}.${signature}`;
}

// Verify and decode token
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, providedSignature] = parts;
    if (!payloadBase64 || !providedSignature) return null;

    const expectedSignature = await sign(payloadBase64, getSecretKey());
    if (providedSignature !== expectedSignature) {
      return null;
    }

    const jsonString = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const data = JSON.parse(jsonString) as SessionUser;

    if (!data.expiresAt || data.expiresAt < Date.now()) {
      return null;
    }

    // Refresh permissions dynamically in case role definition changed
    data.role = normalizeRole(data.role);
    data.permissions = getPermissions(data.role);

    return data;
  } catch (err) {
    return null;
  }
}

// Helper to set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

// Helper to clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Helper to get current session in server components or route handlers
export async function getCurrentSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
