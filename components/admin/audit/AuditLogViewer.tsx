'use client';

import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Search, Filter, Clock, ChevronDown, ChevronUp, User, Shield } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface AuditEntry {
  id: string;
  discord_user_id: string;
  display_name: string;
  action: string;
  target?: string;
  details?: string;
  before_data?: any;
  after_data?: any;
  created_at: string;
}

export const AuditLogViewer: React.FC = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = actionFilter !== 'all' ? `/api/admin/audit?action=${actionFilter}` : '/api/admin/audit';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.display_name?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.target?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
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
              <History size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-black text-white font-display tracking-wide">
                  Audit History
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-vital-500/10 border border-vital-500/30 text-vital-400 text-xs font-bold font-tech uppercase">
                  {logs.length} Events
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                Chronological ledger of administrative modifications, rule publications, and role permissions changes.
              </p>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10 text-xs font-bold self-start sm:self-auto"
          >
            <RefreshCw size={15} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by action, user, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-vital-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto custom-scrollbar w-full sm:w-auto">
          {['all', 'rules.published', 'rule.permissions_updated', 'rules.rollback', 'category.created'].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                actionFilter === act ? 'bg-vital-500 text-white' : 'bg-dark-900 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {act === 'all' ? 'All Events' : act.replace('.', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-dark-900 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-dark-900 border border-white/5 text-gray-400 text-sm">
          No audit entries found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="p-5 rounded-2xl bg-dark-900/90 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-vital-500/10 text-vital-400 flex items-center justify-center shrink-0">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{log.action}</span>
                        {log.target && (
                          <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300 font-mono">
                            {log.target}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{log.details || 'Administrative event executed.'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-gray-500" />
                      <span className="font-bold text-white">{log.display_name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock size={13} />
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>

                    {(log.before_data || log.after_data) && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                        title="View payload"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Payload Diff */}
                {isExpanded && (log.before_data || log.after_data) && (
                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    {log.before_data && (
                      <div className="p-3 rounded-xl bg-dark-950 border border-white/5 text-gray-400">
                        <span className="text-red-400 font-bold block mb-1">Before:</span>
                        <pre className="overflow-x-auto custom-scrollbar">{JSON.stringify(log.before_data, null, 2)}</pre>
                      </div>
                    )}
                    {log.after_data && (
                      <div className="p-3 rounded-xl bg-dark-950 border border-white/5 text-gray-300">
                        <span className="text-emerald-400 font-bold block mb-1">After:</span>
                        <pre className="overflow-x-auto custom-scrollbar">{JSON.stringify(log.after_data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
