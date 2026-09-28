import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission, SUPER_ADMIN_DISCORD_ID, isKnownAdmin } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { enrichStaffRoster } from '@/lib/auth/vital-admin';
import { recordAuditEvent } from '@/lib/audit/audit-logger';


export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  const isAuthorized =
    session &&
    (session.isAdmin ||
      isKnownAdmin(session.discordId) ||
      hasPermission(session.effectivePermissions, 'staff.view', session.discordId));

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized. Requires staff.view permission.' }, { status: 403 });
  }

  const supabase = createAdminClient();
  let staffList: any[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('last_admin_login', { ascending: false });

      if (!error && data) {
        staffList = data;
      }
    } catch {
      // Fallback
    }
  }

  const enrichedStaff = await enrichStaffRoster(staffList, supabase);

  return NextResponse.json({
    staff: enrichedStaff,
    counts: {
      total: enrichedStaff.length,
      active: enrichedStaff.filter((s) => s.active).length,
      inactive: enrichedStaff.filter((s) => !s.active).length,
    },
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'staff.manage', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires staff.manage permission.' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // 1. Full Discord Roster Sync Action
    if (body.action === 'sync' || body.sync === true) {
      const { syncDiscordStaffRoster } = await import('@/lib/auth/vital-admin');
      const syncResult = await syncDiscordStaffRoster();

      if (!syncResult.success) {
        return NextResponse.json(
          { error: syncResult.error || 'Failed to sync staff roster from Discord' },
          { status: 500 }
        );
      }

      await recordAuditEvent({
        discordUserId: session.discordId,
        displayName: session.displayName,
        action: 'staff.roster_synced',
        target: 'Vital RP Discord Guild',
        details: `Synced ${syncResult.seniorAdminsAndAdmins} Senior Admins/Admins (${syncResult.totalStaff} total staff) from Discord`,
        afterData: {
          totalStaff: syncResult.totalStaff,
          seniorAdminsAndAdmins: syncResult.seniorAdminsAndAdmins,
          totalScanned: syncResult.totalScanned,
        },
      });

      // Fetch the updated roster to return immediately to caller
      const supabase = createAdminClient();
      let staffList: any[] = [];
      if (supabase) {
        const { data } = await supabase
          .from('staff_members')
          .select('*')
          .order('last_admin_login', { ascending: false });
        if (data) staffList = data;
      }

      const enrichedStaff = await enrichStaffRoster(staffList, supabase);

      return NextResponse.json({
        success: true,
        message: `Successfully synced ${syncResult.seniorAdminsAndAdmins} Senior Admins/Admins (${syncResult.totalStaff} total staff) from Discord!`,
        totalScanned: syncResult.totalScanned,
        totalStaff: syncResult.totalStaff,
        seniorAdminsAndAdmins: syncResult.seniorAdminsAndAdmins,
        staff: enrichedStaff,
        counts: {
          total: enrichedStaff.length,
          active: enrichedStaff.filter((s) => s.active).length,
          inactive: enrichedStaff.filter((s) => !s.active).length,
        },
      });
    }

    // 2. Individual Staff Member Status Update
    const { discord_user_id, active } = body;

    if (!discord_user_id) {
      return NextResponse.json({ error: 'Missing discord_user_id or action' }, { status: 400 });
    }

    // CRITICAL PROTECTION: Damon can never be disabled or modified by staff management
    if (discord_user_id === SUPER_ADMIN_DISCORD_ID) {
      return NextResponse.json(
        { error: 'Forbidden. The permanent Super Admin (Damon) cannot be disabled or modified.' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from('staff_members')
        .update({ active: Boolean(active), updated_at: new Date().toISOString() })
        .eq('discord_user_id', discord_user_id);
    }

    await recordAuditEvent({
      discordUserId: session.discordId,
      displayName: session.displayName,
      action: 'staff.status_updated',
      target: discord_user_id,
      details: `Updated active status to ${active} for staff member ${discord_user_id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process staff action' }, { status: 500 });
  }
}
