'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { getApiUrl } from '../../lib/api-config';
import { WIKI_ENTITY_TYPES, wikiEntityHref } from '../../lib/wiki/link-core';
export function WikiEntityDirectory() {
  const [pages,setPages]=useState<any[]>([]);
  const [type,setType]=useState(''); const [query,setQuery]=useState(''); const [message,setMessage]=useState('Loading Wiki entities…');
  useEffect(()=>{ fetch(getApiUrl('/api/wiki/entities')).then(async res=>{ const data=await res.json(); if(!res.ok)throw new Error(data.error);setPages(data.pages);setMessage(''); }).catch(err=>setMessage(err.message)); },[]);
  return <div className="min-h-screen bg-dark-950 text-white"><Navbar /><main className="max-w-5xl mx-auto px-5 pt-32 pb-20 space-y-6"><a href="/wiki" className="text-sm text-vital-400">← Wiki</a><h1 className="text-3xl font-bold font-display">Wiki Entities</h1><div className="flex gap-4 text-sm text-vital-400"><a href="/wiki/entities/new">Create Wiki page</a><a href="/wiki/wanted">Wanted Pages</a></div><div className="flex gap-3"><input aria-label="Search Wiki entities" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search names…" className="flex-1 min-w-0 p-3 rounded-xl bg-dark-900 border border-white/10"/><select aria-label="Filter entity type" value={type} onChange={e=>setType(e.target.value)} className="p-3 bg-dark-900 rounded-xl"><option value="">All types</option>{WIKI_ENTITY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>{message && <p role="status" className="text-gray-400">{message}</p>}<div className="grid sm:grid-cols-2 gap-3">{pages.filter(p=>(!type||p.entity_type===type)&&p.title.toLowerCase().includes(query.toLowerCase())).map(p=><a key={p.id} href={wikiEntityHref(p)} className="p-5 border border-white/10 rounded-2xl bg-dark-900/60 hover:border-vital-500/30"><strong>{p.title}</strong><p className="text-xs text-gray-400 capitalize mt-2">{p.entity_type}</p></a>)}</div></main><Footer /></div>;
}
