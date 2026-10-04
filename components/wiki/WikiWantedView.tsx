'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { useAuth } from '../AuthProvider';
import { getApiUrl } from '../../lib/api-config';
import { creationHref, wikiEntityHref } from '../../lib/wiki/link-core';
export function WikiWantedView() {
  const { user } = useAuth();
  const [wanted, setWanted] = useState<any[]>([]);
  const [message, setMessage] = useState('Loading missing pages…');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('reference') || ''); setExpanded(params.get('reference') || '');
    fetch(getApiUrl('/api/wiki/wanted')).then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error); setWanted(data.wanted || []); setMessage(''); }).catch(err => setMessage(err.message));
  }, []);
  const visible = wanted.filter(g => g.normalized_name.includes(query.toLowerCase()));
  return <div className="min-h-screen bg-dark-950 text-white"><Navbar /><main className="max-w-5xl mx-auto px-5 pt-32 pb-20 space-y-6">
    <a href="/wiki" className="text-sm text-vital-400">← Wiki</a><h1 className="font-display font-bold text-3xl">Wanted Pages</h1>
    <p className="text-gray-400 text-sm">These Wiki pages have not been created yet. Existing mentions will connect when a unique exact match is published.</p>
    <a href="/wiki/entities" className="text-xs text-vital-400">Browse all Wiki entities →</a>
    <input aria-label="Search missing Wiki pages" placeholder="Search missing pages…" value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3" />
    {message && <p role="status" className="text-gray-400">{message}</p>}
    {visible.map(g => <article key={`${g.normalized_name}:${g.expected_entity_type}`} className="p-5 rounded-2xl border border-white/10 bg-dark-900/60 space-y-3">
      <button type="button" onClick={() => setExpanded(expanded === g.normalized_name ? '' : g.normalized_name)} className="w-full text-left"><strong className="text-lg text-amber-200/90">{g.name}</strong><span className="text-xs text-gray-400 ml-3 capitalize">{g.expected_entity_type || 'Type unspecified'} · Referenced by {g.page_count} {g.page_count === 1 ? 'page' : 'pages'}</span></button>
      {expanded === g.normalized_name && <div className="space-y-3"><p className="text-sm text-gray-400">This Wiki page does not exist yet.</p>
        {user && <a href={creationHref(g.name,g.expected_entity_type)} className="inline-block text-xs px-4 py-2 rounded-xl bg-vital-500/15 text-vital-400">Create {g.expected_entity_type || 'Wiki page'}: {g.name}</a>}
        {g.references.map(r => <a key={r.id} href={`${wikiEntityHref(r.source)}#${encodeURIComponent(r.section_key)}`} className="block text-sm text-vital-400">{r.source.title} <span className="text-gray-400 text-xs capitalize">({r.source.entity_type}) · {r.section}</span><p className="text-gray-500 text-xs mt-1">{r.context_snippet}</p></a>)}
      </div>}
    </article>)}{!message && !visible.length && <p className="text-gray-400">No missing pages match this search.</p>}
  </main><Footer /></div>;
}
