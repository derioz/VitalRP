import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { getStagedChangesSummary, publishStagedChanges } from '@/lib/rules/supabase-rules';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.view', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  try {
    const summary = await getStagedChangesSummary();
    return NextResponse.json({ summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to inspect staged changes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.publish', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.publish permission.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const publishNote = body.publishNote || '';

    const result = await publishStagedChanges(publishNote, {
      discordId: session.discordId,
      displayName: session.displayName,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to publish rule changes' }, { status: 500 });
  }
}
