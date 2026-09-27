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
      const roleRes = resolveStaffRoles(auth.discordRoles, member.discord_user_id);

      // If user holds no recognized roles in Discord, they are former/inactive staff
      const isCurrentlyActive = member.active && roleRes.isStaff;

      return {
        ...member,
        isSuperAdmin: false,
        primary_role: roleRes.primaryRole || member.primary_role || (isCurrentlyActive ? 'Staff' : 'Former Staff'),
        recognized_roles: roleRes.recognizedRoles || member.recognized_roles || [],
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
    const { discord_user_id, active } = body;

    if (!discord_user_id) {
      return NextResponse.json({ error: 'Missing discord_user_id' }, { status: 400 });
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
    return NextResponse.json({ error: error.message || 'Failed to update staff member' }, { status: 500 });
  }
}
