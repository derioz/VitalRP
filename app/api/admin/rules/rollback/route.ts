import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { rollbackToVersion } from '@/lib/rules/supabase-rules';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.publish', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.publish permission.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const versionNumber = Number(body.versionNumber);

    if (!versionNumber || isNaN(versionNumber)) {
      return NextResponse.json({ error: 'Invalid or missing versionNumber.' }, { status: 400 });
    }

    const result = await rollbackToVersion(versionNumber, {
      discordId: session.discordId,
      displayName: session.displayName,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Rollback failed' }, { status: 500 });
  }
}
