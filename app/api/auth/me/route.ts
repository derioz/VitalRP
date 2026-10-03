import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

  const session = await getCurrentSession(token, forceRefresh);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null, isAdmin: false, isSuperAdmin: false },
      { headers: corsHeaders }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: session,
      isAdmin: session.isAdmin,
      isSuperAdmin: session.isSuperAdmin,
      permissions: session.effectivePermissions,
      discordRoles: session.discordRoles,
      matchedRoleNames: session.matchedRoleNames,
      roleBreakdown: session.roleBreakdown,
    },
    { headers: corsHeaders }
  );
}
