import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('redirect') || '/admin';
  const supabase = await createClient();
  const redirectTo = `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo,
      scopes: 'identify email guilds.members.read',
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize Supabase Discord OAuth.' },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.url);
}
