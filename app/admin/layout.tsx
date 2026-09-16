import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
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

  // Server-side authorization check
  if (!session.permissions.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
        <div className="bg-dark-900 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2 font-display">Access Denied</h1>
          <p className="text-gray-400 mb-6 text-sm">
            You do not have administrative privileges on the Vital RP website.
          </p>
          <div className="bg-black/40 rounded-xl p-4 mb-6 font-tech text-xs text-gray-300 space-y-1 text-left">
            <div>
              <span className="text-gray-500">User:</span> {session.displayName} (@{session.username})
            </div>
            <div>
              <span className="text-gray-500">Discord ID:</span> {session.discordId}
            </div>
            <div>
              <span className="text-gray-500">Assigned Role:</span>{' '}
              <span className="text-vital-400 capitalize">{session.role}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Provide your Discord ID above to management to request staff access.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Back to Home
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
