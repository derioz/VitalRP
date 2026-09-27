'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { SUPER_ADMIN_DISCORD_ID, PERMISSION_DEFINITIONS, AppPermission } from '@/lib/auth/permissions';

interface StaffMember {
  id: string;
  discord_user_id: string;
  discord_username: string;
  discord_display_name: string;
  discord_avatar?: string;
  last_known_roles: string[];
  first_admin_login: string;
  last_admin_login: string;
  active: boolean;
  isSuperAdmin: boolean;
  effectivePermissions: AppPermission[];
  roleBreakdown: Record<string, string[]>;
  matchedRoleNames: string[];
}

export const StaffManager: React.FC = () => {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const canManageStaff = hasPermission('staff.manage');
  const canManagePermissions = hasPermission('permissions.manage');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff roster:', err);
    } finally {
      setLoading(false);
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
      alert('The permanent Super Admin (Damon) cannot be disabled or modified.');
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
      if (!res.ok) throw new Error('Failed to update status');
      await fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.discord_display_name?.toLowerCase().includes(q) ||
      s.discord_username?.toLowerCase().includes(q) ||
      s.discord_user_id?.includes(q) ||
      s.matchedRoleNames?.some((r) => r.toLowerCase().includes(q))
    );
  });

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
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-tech uppercase">
                  {staff.length} Active Staff
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                Staff authority is governed authoritatively by Discord server roles and stored Supabase permission mappings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStaff}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
              title="Refresh Roster"
            >
              <RefreshCw size={16} />
            </button>

            {canManagePermissions && (
              <Link
                href="/admin/permissions"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all"
              >
                <KeyRound size={16} />
                <span>Role Permissions Manager</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, Discord ID, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-vital-500"
        />
      </div>

      {/* Staff Roster Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-dark-900 border border-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((member) => {
            const isSuper = member.discord_user_id === SUPER_ADMIN_DISCORD_ID || member.isSuperAdmin;
            const avatarUrl =
              member.discord_avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(member.discord_display_name || 'Staff')}`;

            return (
              <div
                key={member.discord_user_id}
                className={`p-6 rounded-3xl bg-dark-900/90 border transition-all duration-300 flex flex-col justify-between ${
                  isSuper
                    ? 'border-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.1)] bg-amber-400/[0.02]'
                    : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div>
                  {/* Top Bar: Avatar & Roles */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={member.discord_display_name}
                        className={`w-14 h-14 rounded-2xl object-cover border-2 ${
                          isSuper ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-vital-500/40'
                        }`}
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
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isSuper ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-vital-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                          <Sparkles size={11} className="text-amber-400" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-vital-500/10 border border-vital-500/30 text-vital-400 text-[10px] font-bold uppercase font-tech">
                          {member.matchedRoleNames?.[0] || 'Staff'}
                        </span>
                      )}

                      <span className="text-[11px] text-gray-400">
                        {member.effectivePermissions.length} permissions
                      </span>
                    </div>
                  </div>

                  {/* Name and Discord ID */}
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {member.discord_display_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">@{member.discord_username}</span>
                      <button
                        onClick={() => copyToClipboard(member.discord_user_id)}
                        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-white bg-white/5 px-2 py-0.5 rounded-md font-mono transition-colors"
                        title="Copy Discord Snowflake ID"
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

                  {/* Discord Roles Tag Cloud */}
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-tech">
                      Discord Roles
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.matchedRoleNames && member.matchedRoleNames.length > 0 ? (
                        member.matchedRoleNames.map((r, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] text-gray-300 font-medium"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">None detected</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Details */}
                <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="text-xs font-bold text-vital-400 hover:text-vital-300 flex items-center gap-1"
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
                    >
                      {member.active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
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
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.discord_display_name)}`
                  }
                  alt={selectedMember.discord_display_name}
                  className="w-12 h-12 rounded-xl object-cover border border-vital-500/40"
                />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedMember.discord_display_name}
                  </h3>
                  <span className="text-xs text-gray-400">Effective Website Capabilities</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
              {selectedMember.isSuperAdmin ? (
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs leading-relaxed space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    <Crown size={16} />
                    <span>Permanent Super Admin Status</span>
                  </div>
                  <p>
                    Damon holds permanent, server-side Super Admin authority. All current and future website permissions are granted unconditionally without requiring manual role assignment.
                  </p>
                </div>
              ) : null}

              {PERMISSION_DEFINITIONS.map((def) => {
                const hasPerm = selectedMember.isSuperAdmin || selectedMember.effectivePermissions.includes(def.id);
                const grantedBy = selectedMember.isSuperAdmin
                  ? ['Super Admin Authority']
                  : selectedMember.roleBreakdown?.[def.id] || [];

                return (
                  <div
                    key={def.id}
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      hasPerm ? 'bg-white/[0.02] border-white/10' : 'opacity-40 border-white/5 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hasPerm ? 'bg-emerald-400' : 'bg-gray-600'}`} />
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
