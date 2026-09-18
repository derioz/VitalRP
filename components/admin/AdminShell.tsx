'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { VitalLogo } from '@/components/VitalLogo';
import { useAuth } from '@/components/AuthProvider';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Shield, label: 'User Management', path: '/admin/users' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col lg:flex-row font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-dark-900 border-b border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <VitalLogo className="w-8 h-8 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          <span className="font-display font-bold text-white">VITAL RP</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 shadow-2xl shadow-black/50 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-vital-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-4 relative z-10 w-full">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-vital-500 blur-xl opacity-20 animate-pulse" />
              <VitalLogo className="w-12 h-12 relative z-10 drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white font-display font-black text-xl leading-none tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                VITAL RP
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-vital-500 font-bold tracking-[0.2em] uppercase">
                  Command Center
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-tech font-bold uppercase tracking-wider w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Discord Verified</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-white transition-colors relative z-10"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 relative group ${
                  isActive
                    ? 'text-white bg-vital-500/10 border border-vital-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-vital-500/20 to-transparent rounded-xl pointer-events-none"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  size={18}
                  className={`transition-colors duration-300 relative z-10 ${
                    isActive ? 'text-vital-500' : 'text-gray-400 group-hover:text-white'
                  }`}
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Footer Section */}
        <div className="p-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`}
              alt={user?.displayName || 'User Avatar'}
              className="w-10 h-10 rounded-full border border-vital-500/30 object-cover"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-white text-sm font-bold truncate">{user?.displayName}</span>
              <span className="text-xs text-vital-400 font-tech uppercase tracking-wider capitalize">
                {user?.role ? user.role.replace('_', ' ') : 'Staff'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Home size={14} />
              Website
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 p-6 lg:p-10 w-full overflow-x-hidden">{children}</main>
    </div>
  );
}
