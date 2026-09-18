import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  const session = await getCurrentSession(token);

  if (!session) {
    console.log('[VitalAuth] /api/auth/me -> Returning { authenticated: false, isAdmin: false }');
    return NextResponse.json({ authenticated: false, user: null, isAdmin: false });
  }

  console.log(
    `[VitalAuth] /api/auth/me -> Returning { authenticated: true, user: "${session.displayName}", discordId: "${session.discordId}", isAdmin: ${session.isAdmin} }`
  );

  return NextResponse.json({
    authenticated: true,
    user: session,
    isAdmin: session.isAdmin,
  });
}
