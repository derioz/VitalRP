'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  Edit3,
  ChevronUp,
  Crown,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from './AuthProvider';

export const AdminControls: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, logout, toggleEditMode, editMode, hasPermission } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If user is not an admin, or has zero admin permissions, do not show the pill
  if (!user || !isAdmin) return null;

  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`;

  // Filter accessible admin navigation items based on granular permissions
  const allModules = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Analytics & server overview',
      href: '/admin',
      icon: LayoutDashboard,
      allowed: hasPermission('admin.access'),
    },
    {
      id: 'rules',
      label: 'Rules CMS',
      description: 'Manage & publish server legislation',
      href: '/admin/rules',
      icon: BookOpen,
      allowed: hasPermission('rules.view') || hasPermission('rules.edit'),
      badge: 'CMS',
    },
    {
      id: 'staff',
      label: 'Staff Roster',
      description: 'Discord staff & active roles',
      href: '/admin/staff',
      icon: Users,
      allowed: hasPermission('staff.view') || hasPermission('staff.manage'),
    },
    {
      id: 'permissions',
      label: 'Role Permissions',
      description: 'Map Discord roles to permissions',
      href: '/admin/permissions',
      icon: ShieldCheck,
      allowed: hasPermission('permissions.manage'),
      badge: 'Security',
    },
    {
      id: 'audit',
      label: 'Audit Log',
      description: 'Administrative action history',
      href: '/admin/audit',
      icon: History,
      allowed: hasPermission('audit.view'),
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'System configurations',
      href: '/admin/settings',
      icon: Settings,
      allowed: hasPermission('settings.manage'),
    },
  ];

  const authorizedModules = allModules.filter((m) => m.allowed);

  // If no modules are allowed, hide pill
  if (authorizedModules.length === 0) return null;

  const roleTitle = isSuperAdmin
    ? 'Super Admin'
    : user.matchedRoleNames?.[0] || 'Administrator';

  return (
    <div ref={containerRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] font-sans">
      {/* Expanded Launcher Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[380px] sm:w-[440px] bg-dark-900/95 backdrop-blur-2xl border border-vital-500/30 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(249,115,22,0.15)] flex flex-col gap-4 text-white"
          >
            {/* Header / Identity Banner */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt={user.displayName}
                    className="w-11 h-11 rounded-full border-2 border-vital-500 object-cover shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                  />
                  {isSuperAdmin ? (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-vital-500 rounded-full flex items-center justify-center text-dark-950 shadow-md">
                      <Crown size={12} className="stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-dark-900 rounded-full" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white tracking-wide">{user.displayName}</span>
                    {isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-vital-500/20 border border-vital-500/40 text-vital-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                        <Sparkles size={10} className="text-amber-400 animate-spin-slow" />
                        Super Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {isSuperAdmin ? 'Unrestricted Authority' : roleTitle}
                  </span>
                </div>
              </div>

              {/* Status pill */}
              <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified</span>
              </div>
            </div>

            {/* Quick Modules Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {authorizedModules.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsExpanded(false)}
                  className="group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-vital-500/10 border border-white/5 hover:border-vital-500/40 transition-all duration-200 flex flex-col gap-1.5 overflow-hidden shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-vital-500 group-hover:text-dark-950 text-gray-300 flex items-center justify-center transition-all duration-200">
                      <item.icon size={16} />
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-vital-500/20 text-vital-400 border border-vital-500/30 uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col mt-0.5">
                    <span className="text-xs font-bold text-white group-hover:text-vital-400 transition-colors">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-gray-400 line-clamp-1">{item.description}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                onClick={toggleEditMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  editMode
                    ? 'bg-vital-500 text-white border-vital-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                    : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Edit3 size={13} className={editMode ? 'animate-pulse' : ''} />
                <span>{editMode ? 'Visual Edit On' : 'Visual Edit Mode'}</span>
              </button>

              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all font-semibold"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Floating Launcher Pill */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-dark-900/90 backdrop-blur-xl border border-vital-500/30 hover:border-vital-500/60 rounded-full p-1.5 pl-2 pr-2 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(249,115,22,0.15)] flex items-center gap-2 transition-all"
      >
        {/* User Identity & Toggle */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-3 pl-1 pr-3 py-1 hover:bg-white/5 rounded-full transition-colors text-left group"
          title="Open Admin Console Launcher"
        >
          <div className="relative">
            <img
              src={avatarUrl}
              alt={user.displayName}
              className={`w-8 h-8 rounded-full object-cover border ${
                isSuperAdmin ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-vital-500'
              }`}
            />
            {isSuperAdmin ? (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-dark-950">
                <Crown size={9} className="stroke-[3]" />
              </div>
            ) : (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-dark-900 rounded-full" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-white font-bold text-xs group-hover:text-vital-400 transition-colors">
                {user.displayName}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 leading-none">
              <span
                className={`text-[9px] font-tech uppercase tracking-wider font-bold ${
                  isSuperAdmin ? 'text-amber-400' : 'text-vital-400'
                }`}
              >
                {roleTitle}
              </span>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400 group-hover:text-white ml-0.5"
          >
            <ChevronUp size={15} />
          </motion.div>
        </button>

        <div className="h-5 w-px bg-white/10" />

        {/* Quick Direct Link to Admin Console */}
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-vital-500/10 hover:bg-vital-500 border border-vital-500/30 hover:border-vital-400 text-vital-400 hover:text-dark-950 transition-all font-bold text-xs shadow-sm"
        >
          <LayoutDashboard size={13} />
          <span className="hidden sm:inline">Command Center</span>
        </Link>

        {/* Quick Edit Toggle */}
        <button
          onClick={toggleEditMode}
          className={`p-2 rounded-full border transition-all ${
            editMode
              ? 'bg-vital-500 text-white border-vital-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
              : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'
          }`}
          title={editMode ? 'Visual Editing On' : 'Toggle Visual Edit Mode'}
        >
          <Edit3 size={14} className={editMode ? 'animate-pulse' : ''} />
        </button>
      </motion.div>
    </div>
  );
};