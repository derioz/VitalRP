'use client';
import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../../lib/api-config';
import { WikiSearchResult } from '../../lib/wiki/types';
export function WikiEntitySearch({ onSelect, initialQuery = '' }: { onSelect: (entity: WikiSearchResult) => void; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<WikiSearchResult[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setMessage('Searching…');
      try {
        const res = await fetch(getApiUrl(`/api/wiki/search?q=${encodeURIComponent(query)}&limit=20`), { signal: controller.signal });
        if (!res.ok) throw new Error('Search is unavailable.');
        const data = await res.json();
        setResults(data.results || []);
        setMessage(data.results?.length ? '' : 'No matching Wiki pages.');
      } catch (err) { if (!controller.signal.aborted) setMessage(err instanceof Error ? err.message : 'Search failed.'); }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  return <div className="space-y-2">
    <input aria-label="Search Wiki entities" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search every Wiki entity…" className="w-full bg-dark-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm" />
    {message && <p role="status" className="text-xs text-gray-400">{message}</p>}
    <div className="max-h-60 overflow-auto space-y-1">{results.map(entity => <button type="button" key={entity.id} onClick={() => onSelect(entity)} className="block w-full text-left p-3 rounded-xl hover:bg-vital-500/10 text-white text-sm"><span>{entity.full_name || entity.title}</span><span className="ml-2 text-xs text-gray-400 capitalize">{entity.entity_type || 'character'}</span></button>)}</div>
  </div>;
}
