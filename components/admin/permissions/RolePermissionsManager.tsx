'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Plus,
  Save,
  CheckCircle2,
  X,
  Search,
  ExternalLink,
  Crown,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { PERMISSION_DEFINITIONS, AppPermission } from '@/lib/auth/permissions';

interface DiscordGuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

interface RoleMapping {
  id?: string;
  discord_role_id: string;
  discord_role_name: string;
  discord_role_color?: string;
  enabled: boolean;
  permissions: string[];
}

export const RolePermissionsManager: React.FC = () => {
  const { isSuperAdmin, hasPermission } = useAuth();
  const canManage = hasPermission('permissions.manage');

  const [guildRoles, setGuildRoles] = useState<DiscordGuildRole[]>([]);
  const [mappings, setMappings] = useState<RoleMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeEditingRole, setActiveEditingRole] = useState<RoleMapping | null>(null);
  const [saving, setSaving] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setGuildRoles(data.guildRoles || []);
        setMappings(data.roleMappings || []);
      }
    } catch (err) {
      console.error('Failed to load role mappings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, []);

  const handleSaveMapping = async (mapping: RoleMapping) => {
    if (!canManage) {
      alert('You do not have permission to manage permissions.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update role mapping');
      }

      await fetchRoleData();
      setActiveEditingRole(null);
      setIsNewModalOpen(false);
      alert(`Permissions updated for role "${mapping.discord_role_name}"!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permId: string) => {
    if (!activeEditingRole) return;
    const current = activeEditingRole.permissions || [];
    const exists = current.includes(permId);
    const updated = exists ? current.filter((p) => p !== permId) : [...current, permId];
    setActiveEditingRole({ ...activeEditingRole, permissions: updated });
  };

  // Roles available in guild not yet mapped
  const unmappedGuildRoles = guildRoles.filter(
    (gr) => !mappings.some((m) => m.discord_role_id === gr.id) && gr.name !== '@everyone'
  );

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-900 to-dark-950 border border-white/5 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-vital-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-vital-500/15 border border-vital-500/30 flex items-center justify-center text-vital-500 shadow-[0_0_25px_rgba(249,115,22,0.2)] shrink-0">
              <KeyRound size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-black text-white font-display tracking-wide">
                  Discord Role Permissions
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-vital-500/10 border border-vital-500/30 text-vital-400 text-xs font-bold font-tech uppercase">
                  {mappings.length} Configured Roles
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                Configure what capabilities each Discord server role grants across the website and Rules CMS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRoleData}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
              title="Refresh from Discord Guild"
            >
              <RefreshCw size={16} />
            </button>

            {canManage && (
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all"
              >
                <Plus size={16} />
                <span>Map Discord Role</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Mappings Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mappings.map((mapping) => {
          const isEnabled = mapping.enabled;

          return (
            <div
              key={mapping.discord_role_id}
              className={`p-6 rounded-3xl bg-dark-900/90 border transition-all duration-300 flex flex-col justify-between ${
                isEnabled ? 'border-white/5 hover:border-white/15' : 'border-red-500/20 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: mapping.discord_role_color || '#f97316' }}
                    />
                    <h3 className="text-base font-bold text-white tracking-wide truncate max-w-[180px]">
                      {mapping.discord_role_name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="mt-3 text-xs text-gray-500 font-mono">
                  Snowflake ID: {mapping.discord_role_id}
                </div>

                {/* Permissions List */}
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-tech">
                    Granted Permissions ({mapping.permissions.length})
                  </span>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {mapping.permissions.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No permissions assigned</span>
                    ) : (
                      mapping.permissions.map((p) => {
                        const def = PERMISSION_DEFINITIONS.find((d) => d.id === p);
                        return (
                          <div
                            key={p}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-300"
                          >
                            <span className="font-medium text-white">{def?.name || p}</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">Enabled</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-6 pt-3 border-t border-white/5 flex justify-end">
                {canManage && (
                  <button
                    onClick={() => setActiveEditingRole({ ...mapping })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vital-500/15 hover:bg-vital-500 text-vital-400 hover:text-dark-950 font-bold text-xs transition-colors border border-vital-500/30"
                  >
                    <Sliders size={13} />
                    <span>Configure Capabilities</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* EDIT ROLE CAPABILITIES DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeEditingRole && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveEditingRole(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg bg-dark-900 border-l border-white/10 shadow-2xl flex flex-col h-full z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-dark-950/60">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: activeEditingRole.discord_role_color || '#f97316' }}
                  />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {activeEditingRole.discord_role_name}
                    </h3>
                    <span className="text-xs text-gray-500 font-mono">
                      ID: {activeEditingRole.discord_role_id}
                    </span>
                  </div>
                </div>

                <button onClick={() => setActiveEditingRole(null)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Access Switch */}
                <div className="p-4 rounded-2xl bg-dark-950 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-white block">Website Staff Access</span>
                    <span className="text-xs text-gray-400">Allow holders of this role to access the admin site</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeEditingRole.enabled}
                      onChange={(e) =>
                        setActiveEditingRole({ ...activeEditingRole, enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vital-500" />
                  </label>
                </div>

                {/* Permissions Categorized List */}
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-tech">
                    Assign Role Capabilities
                  </span>

                  {PERMISSION_DEFINITIONS.map((def) => {
                    const isChecked = activeEditingRole.permissions.includes(def.id);

                    return (
                      <label
                        key={def.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-vital-500/10 border-vital-500/40 text-white'
                            : 'bg-dark-950 border-white/5 text-gray-400 hover:border-white/15'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(def.id)}
                          className="mt-1 rounded border-white/20 text-vital-500 focus:ring-vital-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{def.name}</span>
                            <span className="text-[10px] font-mono text-gray-500 uppercase">{def.id}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{def.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-white/10 bg-dark-950/60 flex items-center justify-end gap-3">
                <button
                  onClick={() => setActiveEditingRole(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveMapping(activeEditingRole)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-400 text-white font-bold text-xs shadow-lg transition-all"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MAP NEW DISCORD ROLE MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-dark-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col z-10 text-white max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-base font-bold text-white">Select Vital RP Server Role</h3>
                <button onClick={() => setIsNewModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-3">
                Choose an existing Discord role from the Vital RP guild to configure its website permissions.
              </p>

              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {unmappedGuildRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setIsNewModalOpen(false);
                      setActiveEditingRole({
                        discord_role_id: role.id,
                        discord_role_name: role.name,
                        discord_role_color: `#${(role.color || 0xf97316).toString(16).padStart(6, '0')}`,
                        enabled: true,
                        permissions: ['admin.access', 'rules.view'],
                      });
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-vital-500/10 border border-white/5 hover:border-vital-500/30 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: `#${(role.color || 0xf97316).toString(16).padStart(6, '0')}`,
                        }}
                      />
                      <span className="text-sm font-bold text-white group-hover:text-vital-400 transition-colors">
                        {role.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">{role.id}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
