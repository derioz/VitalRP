import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission, SUPER_ADMIN_DISCORD_ID } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveAuth, resolveStaffRoles } from '@/lib/auth/vital-admin';
import { recordAuditEvent } from '@/lib/audit/audit-logger';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'staff.view', session.discordId)) {
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

  // Ensure Damon (Super Admin) is always in the staff list
  const hasDamon = staffList.some((s) => s.discord_user_id === SUPER_ADMIN_DISCORD_ID);
  if (!hasDamon) {
    staffList.unshift({
      id: 'super-admin-damon',
      discord_user_id: SUPER_ADMIN_DISCORD_ID,
      discord_username: 'damon',
      discord_display_name: 'Damon',
      discord_avatar: 'https://cdn.discordapp.com/avatars/150580708144840704/bedf3166ac36aa21047fee8c77d94c26.png',
      primary_role: 'Super Admin',
      recognized_roles: ['Super Admin'],
      last_known_roles: ['Super Admin'],
      first_admin_login: new Date('2026-09-01T00:00:00Z').toISOString(),
      last_admin_login: new Date().toISOString(),
      active: true,
    });
  }

  // Calculate live effective permissions and hierarchical role breakdowns for each staff member
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

      // If user holds no recognized roles, they are former/inactive staff
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
