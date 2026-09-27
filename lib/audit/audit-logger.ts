import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AuditLogEntry {
  discordUserId: string;
  displayName: string;
  action: string;
  target?: string;
  details?: string;
  beforeData?: any;
  afterData?: any;
}

/**
 * Server-side audit log recorder to Supabase.
 */
export async function recordAuditEvent(entry: AuditLogEntry): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  try {
    await supabase.from('audit_logs').insert({
      discord_user_id: entry.discordUserId,
      display_name: entry.displayName,
      action: entry.action,
      target: entry.target || null,
      details: entry.details || null,
      before_data: entry.beforeData ? JSON.parse(JSON.stringify(entry.beforeData)) : null,
      after_data: entry.afterData ? JSON.parse(JSON.stringify(entry.afterData)) : null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit log:', err);
  }
}

/**
 * Retrieve recent audit logs from Supabase.
 */
export async function getAuditLogs(limitCount = 50, filterAction?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (filterAction) {
      query = query.eq('action', filterAction);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[AuditLogger] Error fetching audit logs:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[AuditLogger] Exception fetching audit logs:', err);
    return [];
  }
}
