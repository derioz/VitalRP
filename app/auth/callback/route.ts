import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/admin';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Auto-promote space (150580708144840704) to owner
      const adminClient = createAdminClient();
      const discordId =
        data.user.user_metadata?.provider_id ||
        data.user.user_metadata?.sub ||
        data.user.identities?.find((i) => i.provider === 'discord')?.id;

      if (adminClient && discordId === '150580708144840704') {
        try {
          await adminClient
            .from('profiles')
            .update({ role: 'owner' })
            .eq('id', data.user.id);
        } catch (err) {
          console.error('Error promoting owner:', err);
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return the user to an error page or home with some instructions
  return NextResponse.redirect(new URL('/?auth_error=supabase_exchange_failed', requestUrl.origin));
}
