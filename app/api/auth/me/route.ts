import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null, isAdmin: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: session,
    isAdmin: session.isAdmin,
  });
}

