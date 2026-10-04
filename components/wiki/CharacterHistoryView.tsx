'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '../AuthProvider';
import { ArrowLeft, History, RotateCcw, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';
import { supabase } from '../../lib/supabase/client';

interface CharacterHistoryViewProps {
  slug: string;
}

export const CharacterHistoryView: React.FC<CharacterHistoryViewProps> = ({ slug }) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [characterName, setCharacterName] = useState(slug);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(getApiUrl(`/api/wiki/characters/${slug}/history`))
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        return res.ok && ct.includes('application/json') ? res.json() : null;
      })
      .then((data) => {
        if (isMounted && data) {
          if (data.pageTitle) setCharacterName(data.pageTitle);
          if (data.revisions) setRevisions(data.revisions);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleRestore = async (revisionId: string, revNum: number) => {
    if (!confirm(`Are you sure you want to restore ${characterName} to Revision #${revNum}?`)) {
      return;
    }

    try {
      setRestoringId(revisionId);
      const { data: authData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${authData.session.access_token}`;
      }

      const res = await fetch(getApiUrl(`/api/wiki/characters/${slug}/history`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ revisionId }),
      });

      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(data?.error || 'Failed to restore revision.');

      setMessage(`Successfully restored to Revision #${revNum}`);
      setTimeout(() => {
        window.location.href = `/wiki/characters/${slug}`;
      }, 1000);
    } catch (err: any) {
      alert(`Rollback error: ${err.message}`);
    } finally {
      setRestoringId(null);
    }
  };

  const canRollback = isSuperAdmin || isAdmin;

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/5">
          <a
            href={`/wiki/characters/${slug}`}
            className="p-2 rounded-xl bg-dark-900 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </a>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-tech text-vital-400 uppercase tracking-widest">
              <History size={13} />
              <span>Version History</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              Revision History: {characterName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Chronological log of edits and published snapshots for this character.
            </p>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{message}</span>
          </div>
        )}

        {/* Revisions Timeline List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-dark-900/50 border border-white/5 space-y-2">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            ))}
          </div>
        ) : revisions.length > 0 ? (
          <div className="space-y-4">
            {revisions.map((rev, idx) => (
              <div
                key={rev.id || idx}
                className="bg-dark-900/60 border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-tech font-bold uppercase tracking-wider bg-vital-500/20 text-vital-400 border border-vital-500/30">
                      Rev #{rev.revision_number}
                    </span>
                    <span className="text-xs font-tech text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      <span>{new Date(rev.created_at).toLocaleString()}</span>
                    </span>
                  </div>

                  <p className="text-sm text-gray-200 font-medium">
                    {rev.summary || 'Content revision'}
                  </p>

                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <User size={12} />
                    <span>Edited by: <strong>{rev.editor_name || rev.editor_discord_id}</strong></span>
                  </div>
                </div>

                {canRollback && idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleRestore(rev.id, rev.revision_number)}
                    disabled={restoringId === rev.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-dark-800 hover:bg-vital-500 text-gray-300 hover:text-white border border-white/10 text-xs font-tech font-bold uppercase tracking-wider transition-colors self-start sm:self-auto shrink-0 disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    <span>{restoringId === rev.id ? 'Restoring...' : 'Restore This Version'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-dark-900/40 border border-white/5 rounded-3xl text-sm text-gray-400">
            No previous revisions recorded for this character.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
