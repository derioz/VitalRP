'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Clock,
  KeyRound,
  Shield,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  UserX,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { SUPER_ADMIN_DISCORD_ID, PERMISSION_DEFINITIONS, AppPermission } from '@/lib/auth/permissions';

interface StaffMember {
  id: string;
  discord_user_id: string;
  discord_username: string;
  discord_display_name: string;
  discord_avatar?: string;
  primary_role?: string;
  recognized_roles?: string[];
  other_roles?: string[];
  last_known_roles: string[];
  first_admin_login: string;
  last_admin_login: string;
  active: boolean;
  isSuperAdmin: boolean;
  effectivePermissions: AppPermission[];
  roleBreakdown: Record<string, string[]>;
  matchedRoleNames: string[];
  discordRoles?: string[];
}

type StatusFilter = 'active' | 'inactive' | 'all';
type RoleFilter =
  | 'all'
  | 'Head Administrator'
  | 'Senior Administrator'
  | 'Administrator'
  | 'Senior Moderator'
  | 'Moderator'
  | 'Support Staff';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 'Never';
  const diffMs = Date.now() - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getRoleBadgeConfig(primaryRole?: string, isSuper?: boolean) {
  if (isSuper || primaryRole === 'Super Admin') {
    return {
      name: 'Super Admin',
      badgeClass:
        'bg-gradient-to-r from-amber-500/20 to-vital-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]',
      borderClass: 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
      cardBorder:
        'border-amber-400/30 shadow-[0_0_25px_rgba(251,191,36,0.08)] bg-amber-400/[0.02]',
      dotClass: 'bg-amber-400',
    };
  }

  switch (primaryRole) {
    case 'Head Administrator':
      return {
        name: 'Head Administrator',
        badgeClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        borderClass: 'border-cyan-500/50',
        cardBorder: 'border-white/5 hover:border-cyan-500/30',
        dotClass: 'bg-cyan-400',
      };
    case 'Senior Administrator':
      return {
        name: 'Senior Administrator',
        badgeClass: 'bg-red-500/10 border-red-500/30 text-red-400',
        borderClass: 'border-red-500/50',
        cardBorder: 'border-white/5 hover:border-red-500/30',
        dotClass: 'bg-red-400',
      };
    case 'Administrator':
      return {
        name: 'Administrator',
        badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
        borderClass: 'border-orange-500/50',
        cardBorder: 'border-white/5 hover:border-orange-500/30',
        dotClass: 'bg-orange-400',
      };
    case 'Senior Moderator':
      return {
        name: 'Senior Moderator',
        badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        borderClass: 'border-purple-500/50',
        cardBorder: 'border-white/5 hover:border-purple-500/30',
        dotClass: 'bg-purple-400',
      };
    case 'Moderator':
      return {
        name: 'Moderator',
        badgeClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        borderClass: 'border-blue-500/50',
        cardBorder: 'border-white/5 hover:border-blue-500/30',
        dotClass: 'bg-blue-400',
      };
    case 'Support Staff':
      return {
        name: 'Support Staff',
        badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        borderClass: 'border-emerald-500/50',
        cardBorder: 'border-white/5 hover:border-emerald-500/30',
        dotClass: 'bg-emerald-400',
      };
    default:
      return {
        name: primaryRole || 'Former Staff',
        badgeClass: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
        borderClass: 'border-gray-500/40',
        cardBorder: 'border-white/5 hover:border-white/10 opacity-75',
        dotClass: 'bg-gray-400',
      };
  }
}

export const StaffManager: React.FC = () => {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const canManageStaff = hasPermission('staff.manage');
  const canManagePermissions = hasPermission('permissions.manage');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

  const fetchStaff = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        const list: StaffMember[] = data.staff || [];
        setStaff(list);
        if (data.counts) {
          setCounts(data.counts);
        } else {
          setCounts({
            total: list.length,
            active: list.filter((s) => s.active).length,
            inactive: list.filter((s) => !s.active).length,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load staff roster:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSyncRoster = async () => {
    setRefreshing(true);
    setSyncStatus(null);

    try {
      const res = await fetch('/api/admin/staff/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync staff roster from Discord');
      }

      if (data.staff) {
        setStaff(data.staff);
      }
      if (data.counts) {
        setCounts(data.counts);
      }

      setSyncStatus({
        message:
          data.message ||
          `Successfully synced ${data.seniorAdminsAndAdmins || 0} Senior Admins & Admins (${
            data.totalStaff || data.staff?.length || 0
          } total staff) from Discord!`,
        type: 'success',
      });
      setTimeout(() => setSyncStatus(null), 6000);
    } catch (err: any) {
      console.error('Error syncing staff roster:', err);
      setSyncStatus({
        message: err.message || 'Error syncing roster from Discord. Refreshing local roster...',
        type: 'error',
      });
      await fetchStaff(true);
      setTimeout(() => setSyncStatus(null), 6000);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (discordId: string, currentActive: boolean) => {
    if (discordId === SUPER_ADMIN_DISCORD_ID) {
      alert('The permanent Super Admin (Damon) cannot be deactivated or modified.');
      return;
    }
    if (!canManageStaff) {
      alert('You lack permission to manage staff.');
      return;
    }

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discord_user_id: discordId, active: !currentActive }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update status');
      }
      await fetchStaff(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter staff by status (active by default), role, and search query
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      // 1. Status Filter (Default: Active staff only)
      if (statusFilter === 'active' && !s.active) return false;
      if (statusFilter === 'inactive' && s.active) return false;

      // 2. Role Filter
      if (roleFilter !== 'all') {
        const matchesPrimary = s.primary_role === roleFilter;
        const matchesRecognized = s.recognized_roles?.includes(roleFilter);
        if (!matchesPrimary && !matchesRecognized) return false;
      }

      // 3. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName =
          s.discord_display_name?.toLowerCase().includes(q) ||
          s.discord_username?.toLowerCase().includes(q);
        const matchesId = s.discord_user_id?.includes(q);
        const matchesPrimaryRole = s.primary_role?.toLowerCase().includes(q);
        const matchesRoles = s.matchedRoleNames?.some((r) => r.toLowerCase().includes(q));

        if (!matchesName && !matchesId && !matchesPrimaryRole && !matchesRoles) {
          return false;
        }
      }

      return true;
    });
  }, [staff, statusFilter, roleFilter, search]);

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-900 to-dark-950 border border-white/5 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-vital-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-vital-500/15 border border-vital-500/30 flex items-center justify-center text-vital-500 shadow-[0_0_25px_rgba(249,115,22,0.2)] shrink-0">
              <Users size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-black text-white font-display tracking-wide">
                  Staff Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-tech uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {counts.active} Active Staff
                </span>
                {counts.inactive > 0 && (
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400 text-xs font-bold font-tech uppercase">
                    {counts.inactive} Former
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                Staff members are detected automatically from Discord server roles upon website login and synced into Supabase with live RBAC permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncRoster}
              disabled={refreshing}
              className={`px-3 py-2.5 rounded-xl bg-vital-500/10 hover:bg-vital-500/20 text-vital-400 hover:text-vital-300 transition-all border border-vital-500/30 flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.15)] ${
                refreshing ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              title="Pull Senior Admins & Admins directly from Discord Guild to grant admin console permissions"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-vital-400' : ''} />
              <span>{refreshing ? 'Syncing from Discord...' : 'Sync Roster'}</span>
            </button>

            {canManagePermissions && (
              <Link
                href="/admin/permissions"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all"
              >
                <KeyRound size={15} />
                <span>Role Permissions</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sync Status Feedback Banner */}
      <AnimatePresence>
        {syncStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              syncStatus.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-red-500/10 border-red-500/30 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {syncStatus.type === 'success' ? (
                <Check size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-red-400 shrink-0" />
              )}
              <span className="font-medium">{syncStatus.message}</span>
            </div>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Status Tabs & Search Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-dark-900 border border-white/10 self-start">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === 'active'
                  ? 'bg-vital-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserCheck size={14} />
              <span>Active Staff</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  statusFilter === 'active'
                    ? 'bg-black/20 text-white'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {counts.active}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === 'inactive'
                  ? 'bg-vital-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserX size={14} />
              <span>Former / Inactive</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  statusFilter === 'inactive'
                    ? 'bg-black/20 text-white'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {counts.inactive}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === 'all'
                  ? 'bg-vital-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>All Staff</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  statusFilter === 'all'
                    ? 'bg-black/20 text-white'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {counts.total}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search by name, role, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vital-500 transition-colors"
            />
          </div>
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider font-tech flex items-center gap-1.5 shrink-0 pr-1">
            <Filter size={12} />
            Role:
          </span>

          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
              roleFilter === 'all'
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-dark-900 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            All Roles
          </button>

          <button
            onClick={() => setRoleFilter('Head Administrator')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              roleFilter === 'Head Administrator'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-dark-900 text-gray-400 hover:text-cyan-400 border border-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Head Administrator</span>
          </button>

          <button
            onClick={() => setRoleFilter('Senior Administrator')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              roleFilter === 'Senior Administrator'
                ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                : 'bg-dark-900 text-gray-400 hover:text-red-400 border border-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Senior Administrator</span>
          </button>

          <button
            onClick={() => setRoleFilter('Administrator')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              roleFilter === 'Administrator'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                : 'bg-dark-900 text-gray-400 hover:text-orange-400 border border-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>Administrator</span>
          </button>

          <button
            onClick={() => setRoleFilter('Senior Moderator')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              roleFilter === 'Senior Moderator'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'bg-dark-900 text-gray-400 hover:text-purple-400 border border-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Senior Moderator</span>
          </button>

          <button
            onClick={() => setRoleFilter('Moderator')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              roleFilter === 'Moderator'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                : 'bg-dark-900 text-gray-400 hover:text-blue-400 border border-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Moderator</span>
          </button>

          <button
            onClick={() => setRoleFilter('Support Staff')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              roleFilter === 'Support Staff'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-dark-900 text-gray-400 hover:text-emerald-400 border border-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Support Staff</span>
          </button>
        </div>
      </div>

      {/* Staff Roster Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-dark-900 border border-white/5 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-dark-900/60 border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-gray-500">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-white">No Staff Members Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {search || roleFilter !== 'all' || statusFilter !== 'active'
              ? 'No staff members match the active filters or search query.'
              : 'No staff members are currently recorded. Any user with a recognized Discord staff role is added automatically upon logging in.'}
          </p>
          {(search || roleFilter !== 'all' || statusFilter !== 'active') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('active');
                setRoleFilter('all');
              }}
              className="mt-2 text-xs font-bold text-vital-400 hover:text-vital-300 underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((member) => {
            const isSuper =
              member.discord_user_id === SUPER_ADMIN_DISCORD_ID || member.isSuperAdmin;
            const roleConfig = getRoleBadgeConfig(member.primary_role, isSuper);
            const avatarUrl =
              member.discord_avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                member.discord_display_name || 'Staff'
              )}&background=18181b&color=ffffff`;

            const otherRecognizedRoles =
              member.other_roles && member.other_roles.length > 0
                ? member.other_roles
                : (member.recognized_roles || []).filter((r) => r !== member.primary_role);

            return (
              <motion.div
                key={member.discord_user_id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`p-6 rounded-3xl bg-dark-900/90 border transition-all duration-300 flex flex-col justify-between ${
                  isSuper
                    ? 'border-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.1)] bg-amber-400/[0.02]'
                    : member.active
                    ? 'border-white/5 hover:border-white/20'
                    : 'border-white/5 bg-dark-950/60 opacity-75'
                }`}
              >
                <div>
                  {/* Top Bar: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={member.discord_display_name}
                        className={`w-14 h-14 rounded-2xl object-cover border-2 ${roleConfig.borderClass}`}
                      />
                      {isSuper ? (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-amber-400 to-vital-500 rounded-full flex items-center justify-center text-dark-950 shadow-md">
                          <Crown size={13} className="stroke-[3]" />
                        </div>
                      ) : (
                        <div
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-dark-900 ${
                            member.active ? 'bg-emerald-500' : 'bg-gray-500'
                          }`}
                          title={member.active ? 'Active Staff' : 'Inactive / Former Staff'}
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {/* Primary Role Badge */}
                      {isSuper ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-vital-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(251,191,36,0.2)] font-tech">
                          <Sparkles size={11} className="text-amber-400" />
                          Super Admin
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase font-tech tracking-wider ${roleConfig.badgeClass}`}
                        >
                          {member.primary_role || 'Staff Member'}
                        </span>
                      )}

                      {/* Active Status Badge */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                            member.active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}
                        >
                          {member.active ? 'Active' : 'Inactive'}
                        </span>

                        <span className="text-[11px] text-gray-500 font-mono">
                          {isSuper
                            ? '10 / 10 perms'
                            : `${member.effectivePermissions?.length || 0} perms`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Name and Discord ID */}
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                      <span>{member.discord_display_name}</span>
                      {isSuper && <Crown size={14} className="text-amber-400 inline" />}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">@{member.discord_username}</span>
                      <button
                        onClick={() => copyToClipboard(member.discord_user_id)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md font-mono transition-colors border border-white/5"
                        title="Click to copy Discord Snowflake ID"
                      >
                        <span>{member.discord_user_id}</span>
                        {copiedId === member.discord_user_id ? (
                          <Check size={11} className="text-emerald-400" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Other Recognized Roles (if multiple held) */}
                  {otherRecognizedRoles.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-gray-500 font-tech">
                        Also Holds:
                      </span>
                      {otherRecognizedRoles.map((roleName, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-medium text-gray-300"
                        >
                          {roleName}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timestamps: Staff Since & Last Login */}
                  <div className="mt-3.5 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar size={11} /> Staff Since
                      </span>
                      <span className="text-gray-300 font-medium font-mono text-[11px] block mt-0.5">
                        {member.first_admin_login
                          ? new Date(member.first_admin_login).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock size={11} /> Last Login
                      </span>
                      <span
                        className="text-gray-300 font-medium font-mono text-[11px] block mt-0.5"
                        title={
                          member.last_admin_login
                            ? new Date(member.last_admin_login).toLocaleString()
                            : 'Never'
                        }
                      >
                        {formatRelativeTime(member.last_admin_login)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Details */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="text-xs font-bold text-vital-400 hover:text-vital-300 flex items-center gap-1 transition-colors"
                  >
                    <span>View Permissions</span>
                    <ExternalLink size={12} />
                  </button>

                  {canManageStaff && (
                    <button
                      onClick={() => handleToggleActive(member.discord_user_id, member.active)}
                      disabled={isSuper}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                        isSuper
                          ? 'opacity-40 cursor-not-allowed text-gray-500 border-white/5'
                          : member.active
                          ? 'text-red-400 border-red-500/20 hover:bg-red-500/10'
                          : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                      }`}
                      title={
                        isSuper
                          ? 'Permanent Super Admin status cannot be deactivated'
                          : member.active
                          ? 'Deactivate staff member'
                          : 'Reactivate staff member'
                      }
                    >
                      {isSuper ? 'Protected' : member.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Permissions Breakdown Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedMember(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <div className="relative w-full max-w-xl bg-dark-900 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl z-10 text-white max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedMember.discord_avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedMember.discord_display_name
                    )}`
                  }
                  alt={selectedMember.discord_display_name}
                  className="w-12 h-12 rounded-xl object-cover border border-vital-500/40"
                />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>{selectedMember.discord_display_name}</span>
                    {selectedMember.isSuperAdmin && (
                      <Crown size={14} className="text-amber-400" />
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {selectedMember.primary_role || 'Staff Member'}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs text-vital-400 font-mono">
                      {selectedMember.discord_user_id}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
              {selectedMember.isSuperAdmin ? (
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs leading-relaxed space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400 text-sm">
                    <Crown size={16} />
                    <span>Permanent Super Admin Status</span>
                  </div>
                  <p>
                    Damon holds permanent, server-side Super Admin authority. All current and future website permissions are granted unconditionally without requiring manual role assignment.
                  </p>
                </div>
              ) : null}

              {PERMISSION_DEFINITIONS.map((def) => {
                const hasPerm =
                  selectedMember.isSuperAdmin ||
                  selectedMember.effectivePermissions?.includes(def.id);
                const grantedBy = selectedMember.isSuperAdmin
                  ? ['Super Admin Authority']
                  : selectedMember.roleBreakdown?.[def.id] || [];

                return (
                  <div
                    key={def.id}
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      hasPerm
                        ? 'bg-white/[0.02] border-white/10'
                        : 'opacity-40 border-white/5 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasPerm ? 'bg-emerald-400' : 'bg-gray-600'
                          }`}
                        />
                        <span className="text-sm font-bold text-white">{def.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                        {def.id}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1 pl-4">{def.description}</p>

                    {hasPerm && grantedBy.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/5 pl-4 flex items-center gap-1.5 text-[11px] text-vital-400">
                        <span className="text-gray-500 font-medium">Granted by:</span>
                        <span className="font-bold">{grantedBy.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
