import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import {
  getAllRulesForAdmin,
  saveRuleDraft,
  discardRuleDraft,
} from '@/lib/rules/supabase-rules';
import { recordAuditEvent } from '@/lib/audit/audit-logger';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.view', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.view permission.' }, { status: 403 });
  }

  try {
    const data = await getAllRulesForAdmin();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.edit', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.edit permission.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await saveRuleDraft(body, {
      discordId: session.discordId,
      displayName: session.displayName,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save rule draft' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.edit', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.edit permission.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const isDiscard = searchParams.get('discard') === 'true';

    if (!ruleId) {
      return NextResponse.json({ error: 'Missing ruleId parameter' }, { status: 400 });
    }

    if (isDiscard) {
      await discardRuleDraft(ruleId, {
        discordId: session.discordId,
        displayName: session.displayName,
      });
      return NextResponse.json({ success: true, message: 'Draft discarded' });
    }

    // Otherwise, stage a delete draft or soft delete
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from('rules_draft')
        .upsert(
          {
            rule_id: ruleId,
            category_id: 'general',
            title: `Deleted rule ${ruleId}`,
            content: '',
            action: 'delete',
            created_by_discord_id: session.discordId,
            created_by_name: session.displayName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'rule_id' }
        );
    }

    await recordAuditEvent({
      discordUserId: session.discordId,
      displayName: session.displayName,
      action: 'rule.staged_delete',
      target: ruleId,
      details: `Staged rule ${ruleId} for deletion upon next publish.`,
    });

    return NextResponse.json({ success: true, message: 'Rule marked for deletion upon publishing.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete rule' }, { status: 500 });
  }
}
