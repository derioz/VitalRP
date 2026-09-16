import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase/admin';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { Role, normalizeRole } from '@/lib/auth/rbac';

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const stateEncoded = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('discord_oauth_state')?.value;
  cookieStore.delete('discord_oauth_state');

  if (error) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error)}`, request.nextUrl.origin));
  }

  if (!code || !stateEncoded) {
    return NextResponse.redirect(new URL('/?auth_error=missing_code_or_state', request.nextUrl.origin));
  }

  // Verify CSRF state
  let returnTo = '/';
  try {
    const parsedState = JSON.parse(Buffer.from(stateEncoded, 'base64url').toString('utf-8'));
    if (!savedState || parsedState.state !== savedState) {
      return NextResponse.redirect(new URL('/?auth_error=csrf_validation_failed', request.nextUrl.origin));
    }
    returnTo = parsedState.returnTo || '/';
  } catch (err) {
    return NextResponse.redirect(new URL('/?auth_error=invalid_state_format', request.nextUrl.origin));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/discord/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Discord credentials are not configured on server.' }, { status: 500 });
  }

  try {
    // 1. Exchange code for Discord Access Token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text();
      console.error('Discord token exchange failed:', errData);
      return NextResponse.redirect(new URL('/?auth_error=token_exchange_failed', request.nextUrl.origin));
    }

    const tokenData: DiscordTokenResponse = await tokenResponse.json();

    // 2. Fetch User Identity from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/?auth_error=user_fetch_failed', request.nextUrl.origin));
    }

    const discordUser: DiscordUserResponse = await userResponse.json();
    const discordId = discordUser.id;
    const username = discordUser.username;
    const displayName = discordUser.global_name || discordUser.username;
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0', 10) % 5}.png`;

    // 3. Check / Update User Record in Firestore (users/{discordId})
    let role: Role = 'user';

    if (adminDb) {
      const userRef = adminDb.collection('users').doc(discordId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const existingData = userDoc.data();
        role = normalizeRole(existingData?.role);

        // Update latest profile details while preserving role
        await userRef.set(
          {
            discordId,
            username,
            displayName,
            email: discordUser.email || existingData?.email || '',
            avatarUrl,
            lastLogin: new Date(),
          },
          { merge: true }
        );
      } else {
        // Create new user record
        await userRef.set({
          discordId,
          username,
          displayName,
          email: discordUser.email || '',
          avatarUrl,
          role: 'user',
          createdAt: new Date(),
          lastLogin: new Date(),
        });
      }
    } else {
      console.warn('Firebase Admin DB is unavailable; running session in fallback mode.');
    }

    // 4. Create and set signed HTTP-only session cookie
    const sessionToken = await createSessionToken({
      discordId,
      username,
      displayName,
      avatar: avatarUrl,
      email: discordUser.email,
      role,
    });

    await setSessionCookie(sessionToken);

    // If destination was /admin but role is not authorized, redirect to /
    const isReturningToAdmin = returnTo.startsWith('/admin');
    const finalDestination = isReturningToAdmin && role === 'user' ? '/?unauthorized=true' : returnTo;

    return NextResponse.redirect(new URL(finalDestination, request.nextUrl.origin));
  } catch (err: any) {
    console.error('Unhandled error in Discord OAuth callback:', err);
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(err.message || 'unknown')}`, request.nextUrl.origin));
  }
}
