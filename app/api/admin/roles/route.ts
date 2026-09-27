import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { getDiscordGuildRoles, invalidateRoleCache } from '@/lib/auth/vital-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAuditEvent } from '@/lib/audit/audit-logger';

// Default role mappings fallback
const FALLBACK_MAPPINGS = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    discord_role_id: '733090996660863056',
    discord_role_name: 'Senior Administrator',
    discord_role_color: '#ef4444',
    enabled: true,
    permissions: [
      'admin.access', 'rules.view', 'rules.edit', 'rules.publish', 'rules.history',
      'staff.view', 'staff.manage', 'permissions.manage', 'audit.view', 'settings.manage'
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    discord_role_id: '733091115577901158',
    discord_role_name: 'Administrator',
    discord_role_color: '#f97316',
    enabled: true,
    permissions: [
      'admin.access', 'rules.view', 'rules.edit', 'rules.publish', 'rules.history',
      'staff.view', 'audit.view', 'settings.manage'
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    discord_role_id: '733091376832708689',
    discord_role_name: 'Moderator',
    discord_role_color: '#3b82f6',
    enabled: true,
    permissions: ['admin.access', 'rules.view', 'rules.history'],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    discord_role_id: '733091380540473384',
    discord_role_name: 'Support Staff',
    discord_role_color: '#10b981',
    enabled: true,
    permissions: ['admin.access', 'rules.view'],
  },
];

let memRoleMappings = [...FALLBACK_MAPPINGS];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'permissions.manage', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires permissions.manage.' }, { status: 403 });
  }

  // Fetch live Discord guild roles via bot token
  const discordRoles = await getDiscordGuildRoles();

  // Fetch configured role mappings from Supabase
  const supabase = createAdminClient();
  let configuredMappings: any[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('discord_role_mappings')
        .select(`
          id,
          discord_role_id,
          discord_role_name,
          discord_role_color,
          enabled,
          discord_role_permissions (
            permission
          )
        `)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        configuredMappings = data.map((item) => ({
          id: item.id,
          discord_role_id: item.discord_role_id,
          discord_role_name: item.discord_role_name,
          discord_role_color: item.discord_role_color,
          enabled: item.enabled,
          permissions: (item.discord_role_permissions as any[]).map((p) => p.permission),
        }));
      }
    } catch {
      // Fallback
    }
  }

  if (configuredMappings.length === 0) {
    configuredMappings = memRoleMappings;
  }

  return NextResponse.json({
    guildRoles: discordRoles,
    roleMappings: configuredMappings,
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'permissions.manage', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires permissions.manage.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { discord_role_id, discord_role_name, discord_role_color, enabled, permissions } = body;

    if (!discord_role_id || !discord_role_name) {
      return NextResponse.json({ error: 'Missing discord_role_id or discord_role_name' }, { status: 400 });
    }

    const supabase = createAdminClient();
    let mappingId = body.id;

    if (supabase) {
      try {
        // Upsert role mapping
        const { data: mappingData, error: mappingErr } = await supabase
          .from('discord_role_mappings')
          .upsert(
            {
              discord_role_id,
              discord_role_name,
              discord_role_color: discord_role_color || '#f97316',
              enabled: enabled ?? true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'discord_role_id' }
          )
          .select('id')
          .single();

        if (mappingErr) throw mappingErr;
        mappingId = mappingData.id;

        // Replace permissions
        await supabase.from('discord_role_permissions').delete().eq('role_mapping_id', mappingId);

        if (Array.isArray(permissions) && permissions.length > 0) {
          const toInsert = permissions.map((p: string) => ({
            role_mapping_id: mappingId,
            permission: p,
          }));
          await supabase.from('discord_role_permissions').insert(toInsert);
        }
      } catch (dbErr) {
        console.warn('[AdminRoles API] DB error saving role mapping:', dbErr);
      }
    }

    // Update memory fallback
    const existingIdx = memRoleMappings.findIndex((m) => m.discord_role_id === discord_role_id);
    const updatedRecord = {
      id: mappingId || `map-${Date.now()}`,
      discord_role_id,
      discord_role_name,
      discord_role_color: discord_role_color || '#f97316',
      enabled: enabled ?? true,
      permissions: Array.isArray(permissions) ? permissions : [],
    };

    if (existingIdx >= 0) {
      memRoleMappings[existingIdx] = updatedRecord;
    } else {
      memRoleMappings.push(updatedRecord);
    }

    // Invalidate auth cache so permissions refresh immediately
    invalidateRoleCache();

    // Record audit event
    await recordAuditEvent({
      discordUserId: session.discordId,
      displayName: session.displayName,
      action: 'role.permissions_updated',
      target: discord_role_name,
      details: `Updated permissions for Discord role "${discord_role_name}" (${discord_role_id})`,
      afterData: { permissions, enabled },
    });

    return NextResponse.json({ success: true, mapping: updatedRecord });
  } catch (error: any) {
    console.error('[AdminRoles API] Error saving role mapping:', error);
    return NextResponse.json({ error: error.message || 'Failed to update role mapping' }, { status: 500 });
  }
}
