import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

  const session = await getCurrentSession(token, forceRefresh);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null, isAdmin: false, isSuperAdmin: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: session,
    isAdmin: session.isAdmin,
    isSuperAdmin: session.isSuperAdmin,
    permissions: session.effectivePermissions,
    discordRoles: session.discordRoles,
    matchedRoleNames: session.matchedRoleNames,
    roleBreakdown: session.roleBreakdown,
  });
}
