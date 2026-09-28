import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission, SUPER_ADMIN_DISCORD_ID } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveAuth, resolveStaffRoles, syncDiscordStaffRoster } from '@/lib/auth/vital-admin';
import { recordAuditEvent } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  // Authorize anyone with staff.manage, staff.view, or admin console access
  const isAuthorized =
    session &&
    (session.isAdmin ||
      hasPermission(session.effectivePermissions, 'staff.manage', session.discordId) ||
      hasPermission(session.effectivePermissions, 'staff.view', session.discordId));

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Requires staff management permissions.' },
      { status: 403 }
    );
  }

  try {
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

    const enrichedStaff = await Promise.all(
      staffList.map(async (member) => {
        const isSuper = member.discord_user_id === SUPER_ADMIN_DISCORD_ID;
        if (isSuper) {
          const auth = await getEffectiveAuth(SUPER_ADMIN_DISCORD_ID);
          return {
            ...member,
            isSuperAdmin: true,
            primary_role: 'Super Admin',
            recognized_roles: ['Super Admin'],
            other_roles: [],
            active: true,
            effectivePermissions: auth.permissions,
            roleBreakdown: auth.roleBreakdown,
            matchedRoleNames: ['Super Admin'],
            discordRoles: [],
          };
        }

        const auth = await getEffectiveAuth(member.discord_user_id);
        const rolesToCheck =
          auth.discordRoles && auth.discordRoles.length > 0
            ? auth.discordRoles
            : Array.isArray(member.last_known_roles)
            ? member.last_known_roles
            : [];
        const roleRes = resolveStaffRoles(rolesToCheck, member.discord_user_id);
        const isCurrentlyActive = Boolean(member.active) && roleRes.isStaff;

        return {
          ...member,
          isSuperAdmin: false,
          primary_role: roleRes.primaryRole || (isCurrentlyActive ? 'Staff' : 'Former Staff'),
          recognized_roles: roleRes.recognizedRoles,
          other_roles: roleRes.otherRoles || [],
          active: isCurrentlyActive,
          effectivePermissions: auth.permissions,
          roleBreakdown: auth.roleBreakdown,
          matchedRoleNames: roleRes.recognizedRoles.length > 0 ? roleRes.recognizedRoles : auth.matchedRoleNames,
          discordRoles: auth.discordRoles,
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncResult.seniorAdminsAndAdmins} Senior Admins & Admins (${syncResult.totalStaff} total staff) from Discord!`,
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
  } catch (error: any) {
    console.error('[AdminStaffSync API] Error syncing staff roster:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync staff roster' },
      { status: 500 }
    );
  }
}
