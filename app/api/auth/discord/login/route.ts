import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/discord/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'DISCORD_CLIENT_ID is not configured in server environment.' },
      { status: 500 }
    );
  }

  // Generate random CSRF state token
  const stateRandom = crypto.randomUUID();
  const returnTo = request.nextUrl.searchParams.get('redirect') || '/';
  const statePayload = Buffer.from(JSON.stringify({ state: stateRandom, returnTo })).toString('base64url');

  const cookieStore = await cookies();
  cookieStore.set('discord_oauth_state', stateRandom, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });

  const scopes = ['identify', 'email', 'guilds.members.read'].join(' ');
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', statePayload);
  authUrl.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(authUrl.toString());
}
