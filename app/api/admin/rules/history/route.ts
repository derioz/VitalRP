import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { getRuleChangeHistory } from '@/lib/rules/supabase-rules';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.history', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.history.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const ruleId = searchParams.get('ruleId');

  if (!ruleId) {
    return NextResponse.json({ error: 'Missing ruleId query parameter' }, { status: 400 });
  }

  try {
    const history = await getRuleChangeHistory(ruleId);
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch rule history' }, { status: 500 });
  }
}
