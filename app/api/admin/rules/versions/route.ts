import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { getVersionHistory } from '@/lib/rules/supabase-rules';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.history', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.history.' }, { status: 403 });
  }

  try {
    const versions = await getVersionHistory();
    return NextResponse.json({ versions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch versions' }, { status: 500 });
  }
}
