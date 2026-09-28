import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { seedExistingRulesIfEmpty } from '@/lib/rules/supabase-rules';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.edit', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.edit permission.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const result = await seedExistingRulesIfEmpty(
      undefined,
      force,
      body.categories,
      body.rules
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
