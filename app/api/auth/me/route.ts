import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        discordId: session.discordId,
        username: session.username,
        displayName: session.displayName,
        avatar: session.avatar,
        photoURL: session.avatar,
        email: session.email,
        role: session.role,
        permissions: session.permissions,
      },
    },
    { status: 200 }
  );
}
