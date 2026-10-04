'use client';
import React, { useEffect, useState } from 'react';
import { WikiLink, WikiLinkAudit } from '../../lib/wiki/types';
import { wikiFetch } from '../../lib/wiki/client-api';
import { creationHref, wikiEntityHref } from '../../lib/wiki/link-core';
import { WikiEntitySearch } from './WikiEntitySearch';
export function WikiLinkManager({ sourceId, onUpdated }: { sourceId?: string; onUpdated?: () => void }) {
  const [links, setLinks] = useState<WikiLink[]>([]);
  const [audit, setAudit] = useState<WikiLinkAudit[]>([]);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('unresolved');
  const [editing, setEditing] = useState<WikiLink | null>(null);
  const [visibleText, setVisibleText] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try { const data = await wikiFetch(`/api/wiki/links${sourceId ? `?source=${encodeURIComponent(sourceId)}` : ''}`); setLinks(data.links); setAudit(data.audit); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to load links.'); }
  };
  useEffect(() => { void load(); }, [sourceId]);
  const act = async (link: WikiLink, action: string, targetId?: string) => {
    setBusy(true); setMessage('');
    try {
      await wikiFetch(`/api/wiki/links/${link.id}`, { method: 'PATCH', body: JSON.stringify({ action, targetId, ...(action === 'target' && visibleText !== link.display_name ? { displayName: visibleText } : {}) }) });
      setEditing(null); await load(); onUpdated?.(); setMessage(action === 'leave' ? 'Left unresolved.' : 'Link saved.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to save link.'); }
    finally { setBusy(false); }
  };
  const filtered = links.filter(l => (tab === 'all' || l.status === tab || (tab === 'potential' && l.status === 'unresolved' && l.potential_matches?.length)) && `${l.display_name} ${l.source?.title || ''} ${l.section_title}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">{[['unresolved','Unresolved Links'],['broken','Broken Links'],['potential','Potential Matches'],['automatic','Automatically Resolved'],['all','All Links']].map(([id,label]) => <button type="button" key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-xl text-xs ${tab === id ? 'bg-vital-500/20 text-vital-400' : 'bg-white/5 text-gray-300'}`}>{label}</button>)}</div>
    <input aria-label="Search unresolved links" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search names, source pages, or sections…" className="w-full px-3 py-2 bg-dark-950 border border-white/10 rounded-xl text-sm text-white" />
    {message && <p role="status" className="text-sm text-gray-300">{message}</p>}
    {tab === 'automatic' ? <div className="space-y-2">{audit.filter(a => a.method === 'automatic' && a.previous_unresolved_text.toLowerCase().includes(query.toLowerCase())).map((a,i) => <div key={i} className="p-3 border border-white/10 rounded-xl text-xs text-gray-300">{a.previous_unresolved_text} → {a.resolved_entity_id} <span className="text-gray-500">{new Date(a.resolved_at).toLocaleString()}</span></div>)}</div> : <div className="space-y-3">{filtered.map(link => <div key={link.id} className="p-4 rounded-2xl border border-white/10 bg-dark-950/40 space-y-2">
      <div className="text-white font-semibold">{link.display_name} <span className="text-xs font-normal text-gray-400">Expected: {link.expected_entity_type || 'Any type'}</span></div>
      <p className="text-xs text-gray-400">{link.source && <a href={wikiEntityHref(link.source)} className="text-vital-400">{link.source.title} · </a>}Found in: {link.section_title} · {link.status}</p>
      {link.target && <p className="text-xs text-gray-300">Linked entity: {link.target.title} ({link.target.entity_type})</p>}
      <p className="text-xs text-gray-500">{link.context_snippet}</p>
      {!!link.potential_matches?.length && link.status === 'unresolved' && <p className="text-xs text-amber-200/80">Exact candidates: {link.potential_matches.map(p => `${p.title} (${p.entity_type})`).join(', ')}</p>}
      <div className="flex flex-wrap gap-3 text-xs">
        <button disabled={busy} type="button" onClick={() => { setEditing(link); setVisibleText(link.display_name); }} className="text-vital-400">{link.target_page_id ? 'Edit Link / Change Target' : 'Link to Existing Page'}</button>
        {link.status === 'unresolved' && <><a className="text-amber-300" href={creationHref(link.original_mention_text.replace(/^@/, ''),link.expected_entity_type)}>Create Page</a><button disabled={busy} type="button" onClick={() => act(link,'leave')} className="text-gray-400">Leave Unresolved</button></>}
        <button disabled={busy} type="button" onClick={() => act(link,'remove')} className="text-red-400">Remove Link</button>
      </div>
      {editing?.id === link.id && <div role="dialog" aria-label="Change Wiki link target" className="pt-3 space-y-3 border-t border-white/10">
        <label className="text-xs text-gray-400 block">Visible text (optional change)<input value={visibleText} onChange={e => setVisibleText(e.target.value)} className="block w-full bg-dark-900 rounded-lg p-2 text-white mt-1" /></label>
        <fieldset disabled={busy}><WikiEntitySearch initialQuery={link.display_name} onSelect={target => act(link,'target',target.id)} /></fieldset>
        <button type="button" onClick={() => setEditing(null)} className="text-xs text-gray-400">Cancel</button>
      </div>}
    </div>)}{!filtered.length && <p className="text-sm text-gray-500">No links in this view.</p>}</div>}
    {!sourceId && <button disabled={busy} type="button" onClick={async () => { setBusy(true); try { const result = await wikiFetch('/api/wiki/links',{ method:'POST' }); setMessage(`Indexed ${result.imported} existing Wiki pages.`); await load(); } catch(err) { setMessage(err instanceof Error ? err.message : 'Import failed.'); } finally { setBusy(false); } }} className="text-xs text-vital-400">Index existing Wiki mentions</button>}
  </div>;
}
