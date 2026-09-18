import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const session = await getCurrentSession();

  if (!session) {
    redirect('/api/auth/discord/login?redirect=/admin');
  }

  console.log(
    `[VitalAuth] /admin layout check -> User: "${session.displayName}", Discord ID: "${session.discordId}", isAdmin: ${session.isAdmin}`
  );

  // Server-side authorization check (Strict Discord Guild Membership + Role 733091115577901158)
  if (!session.isAdmin) {
    console.log(
      `[VitalAuth] /admin -> User "${session.displayName}" (${session.discordId}) does not have Admin Role. Redirecting to homepage.`
    );
    redirect('/');
  }

  return <AdminShell>{children}</AdminShell>;
}
