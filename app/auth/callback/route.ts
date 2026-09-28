import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractDiscordId } from '@/lib/auth/session';
import { syncStaffMemberOnLogin } from '@/lib/auth/vital-admin';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const discordId = extractDiscordId(data.user);

      // Automatically sync staff member record in Supabase:
      // Adds recognized staff roles, updates logins, and deactivates former staff.
      if (discordId) {
        try {
          await syncStaffMemberOnLogin(discordId, data.user.user_metadata);
        } catch (syncErr) {
          console.error('[VitalAuth] Error syncing staff member on login:', syncErr);
        }
      }

      // Auto-promote staff and admins in profiles
      const adminClient = createAdminClient();
      if (adminClient && discordId) {
        try {
          if (discordId === '150580708144840704') {
            await adminClient
              .from('profiles')
              .update({ role: 'owner' })
              .eq('id', data.user.id);
          } else {
            // Check if member is recognized admin or senior admin in staff_members
            const { data: staffMember } = await adminClient
              .from('staff_members')
              .select('last_known_roles, active')
              .eq('discord_user_id', discordId)
              .maybeSingle();

            const isStaffAdmin =
              staffMember &&
              staffMember.active &&
              Array.isArray(staffMember.last_known_roles) &&
              staffMember.last_known_roles.some((r: string) => r.includes('Admin'));

            if (isStaffAdmin || discordId === '399373087172198400') {
              await adminClient
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', data.user.id);
            }
          }
        } catch (err) {
          console.error('Error promoting owner/admin:', err);
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Gracefully return the user to the intended destination or home
  return NextResponse.redirect(new URL(next || '/', requestUrl.origin));
}

