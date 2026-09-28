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

    // 2. Adjust Staff Permissions Action
    if (body.action === 'update_permissions' || Array.isArray(body.permissions)) {
      const { discord_user_id, permissions } = body;

      if (!discord_user_id) {
        return NextResponse.json({ error: 'Missing discord_user_id' }, { status: 400 });
      }

      // CRITICAL PROTECTION: Super Admin (Damon) cannot be downgraded or modified
      if (discord_user_id === SUPER_ADMIN_DISCORD_ID) {
        return NextResponse.json(
          { error: 'Forbidden. The permanent Super Admin (Damon) holds permanent, immutable permissions.' },
          { status: 403 }
        );
      }

      const supabase = createAdminClient();
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
      }

      const permsArray: string[] = Array.isArray(permissions) ? permissions : [];

      // 1. Get staff record
      const { data: memberRecord } = await supabase
        .from('staff_members')
        .select('*')
        .eq('discord_user_id', discord_user_id)
        .maybeSingle();

      const staffDisplayName = memberRecord?.discord_display_name || discord_user_id;

      // 2. Upsert in discord_role_mappings for user:discord_user_id
      const roleMappingIdKey = `user:${discord_user_id}`;
      const { data: existingMapping } = await supabase
        .from('discord_role_mappings')
        .select('id')
        .eq('discord_role_id', roleMappingIdKey)
        .maybeSingle();

      let mappingId = existingMapping?.id;
      if (!mappingId) {
        const { data: newMapping } = await supabase
          .from('discord_role_mappings')
          .insert({
            discord_role_id: roleMappingIdKey,
            discord_role_name: `Staff: ${staffDisplayName}`,
            discord_role_color: '#f97316',
            enabled: true,
          })
          .select('id')
          .single();
        mappingId = newMapping?.id;
      }

      if (mappingId) {
        // Clear previous custom permissions for this user
        await supabase
          .from('discord_role_permissions')
          .delete()
          .eq('role_mapping_id', mappingId);

        // Insert new permissions
        if (permsArray.length > 0) {
          const permRows = permsArray.map((p) => ({
            role_mapping_id: mappingId,
            permission: p,
          }));
          await supabase.from('discord_role_permissions').insert(permRows);
        }
      }

      // 3. Update last_known_roles in staff_members with perm: tokens for safety
      if (memberRecord) {
        const existingRoles = Array.isArray(memberRecord.last_known_roles)
          ? memberRecord.last_known_roles.filter((r: any) => typeof r === 'string' && !r.startsWith('perm:'))
          : [];
        const newRoles = [...existingRoles, ...permsArray.map((p) => `perm:${p}`)];
        await supabase
          .from('staff_members')
          .update({ last_known_roles: newRoles, updated_at: new Date().toISOString() })
          .eq('discord_user_id', discord_user_id);
      }

      // 4. Invalidate role cache
      const { invalidateRoleCache } = await import('@/lib/auth/vital-admin');
      invalidateRoleCache(discord_user_id);

      await recordAuditEvent({
        discordUserId: session.discordId,
        displayName: session.displayName,
        action: 'staff.permissions_updated',
        target: discord_user_id,
        details: `Updated permissions for ${staffDisplayName}: ${permsArray.join(', ') || 'none'}`,
        afterData: { permissions: permsArray },
      });

      // Return updated enriched member
      const { data: updatedList } = await supabase
        .from('staff_members')
        .select('*')
        .eq('discord_user_id', discord_user_id);

      const enriched = await enrichStaffRoster(updatedList || [], supabase);

      return NextResponse.json({
        success: true,
        message: `Updated permissions for ${staffDisplayName}!`,
        member: enriched[0],
      });
    }

    // 3. Individual Staff Member Status Update
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
