import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Auto-promote known admins
      const adminClient = createAdminClient();
      const discordId =
        data.user.user_metadata?.provider_id ||
        data.user.user_metadata?.sub ||
        data.user.identities?.find((i) => i.provider === 'discord')?.id;

      if (adminClient && (discordId === '150580708144840704' || discordId === '399373087172198400')) {
        try {
          await adminClient
            .from('profiles')
            .update({ role: discordId === '150580708144840704' ? 'owner' : 'admin' })
            .eq('id', data.user.id);
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

