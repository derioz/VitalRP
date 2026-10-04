'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { useAuth } from '../AuthProvider';
import { WikiEntityDetail, WikiSection } from '../../lib/wiki/types';
import { WIKI_ENTITY_TYPES, wikiEntityHref, renderWikiHtml, mentionMarker } from '../../lib/wiki/link-core';
import { wikiFetch } from '../../lib/wiki/client-api';
import { WikiRichEditor } from './WikiRichEditor';
import { WikiLinkManager } from './WikiLinkManager';
import { CharacterBacklinks } from './CharacterBacklinks';
export function WikiEntityView({ id, creating = false }: { id?: string; creating?: boolean }) {
  const { user } = useAuth();
  const [page, setPage] = useState<WikiEntityDetail | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [aliases, setAliases] = useState('');
  const [sections, setSections] = useState<WikiSection[]>([{ section_key:'biography', title:'Biography', content_html:'', sort_order:1 }]);
  const [editing, setEditing] = useState(creating);
  const [canEdit, setCanEdit] = useState(false);
  const [message, setMessage] = useState(creating ? '' : 'Loading Wiki page…');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    if (!id) return;
    try {
      const result = await wikiFetch(`/api/wiki/entities/${encodeURIComponent(id)}`);
      setPage(result); setTitle(result.title); setType(result.entity_type); setAliases((result.aliases || []).join(', '));
      setSections(result.sections.map(s => ({ ...s, content_html: s.content_html.replace(/<span\b[^>]*data-wiki-link-id="([^"]+)"[^>]*>[^<]*<\/span>/gi, (whole, linkId) => { const link = result.wiki_links.find(l => l.id === linkId); return link ? mentionMarker(link) : whole; }) })));
      setCanEdit(result.can_edit); setMessage('');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Page is unavailable.'); }
  };
  useEffect(() => {
    if (creating) { const params = new URLSearchParams(window.location.search); setTitle(params.get('name') || ''); setType(params.get('type') || ''); }
    else void load();
  }, [id, creating, user?.id]);
  const save = async () => {
    setBusy(true); setMessage('');
    try {
      const saved = await wikiFetch(creating ? '/api/wiki/entities' : `/api/wiki/entities/${id}`, { method: creating ? 'POST' : 'PUT', body: JSON.stringify({ title, entity_type:type, aliases:aliases.split(',').map(a=>a.trim()).filter(Boolean), sections }) });
      window.location.href = wikiEntityHref(saved);
    } catch(err) { setMessage(err instanceof Error ? err.message : 'Unable to save.'); } finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-dark-950 text-white"><Navbar /><main className="max-w-5xl mx-auto px-5 pt-32 pb-20 space-y-6">
    <div className="flex gap-4 text-sm text-vital-400"><a href="/wiki/entities">← Wiki entities</a><a href="/wiki/wanted">Wanted Pages</a></div>
    <h1 className="font-display font-bold text-3xl">{creating ? 'Create Wiki Page' : page?.title || 'Wiki Page'}</h1>
    {message && <p role="status" className="text-amber-200 text-sm">{message}</p>}
    {creating && !user ? <p className="text-gray-400">Sign in with Discord to create a Wiki page.</p> : editing ? <div className="space-y-5">
      <label className="block text-sm text-gray-400">Name<input value={title} onChange={e=>setTitle(e.target.value)} className="block w-full bg-dark-900 rounded-xl border border-white/10 px-4 py-3 mt-2 text-white" /></label>
      {creating && <label className="block text-sm text-gray-400">Entity type<select aria-label="Entity type" value={type} onChange={e=>setType(e.target.value)} className="block w-full bg-dark-900 rounded-xl p-3 mt-2 text-white"><option value="">Choose entity type…</option>{WIKI_ENTITY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}{type && !WIKI_ENTITY_TYPES.includes(type) && <option value={type}>{type}</option>}</select></label>}
      <label className="block text-sm text-gray-400">Aliases (separated by commas)<input value={aliases} onChange={e=>setAliases(e.target.value)} className="block w-full bg-dark-900 rounded-xl p-3 mt-2 text-white" /></label>
      {sections.map((s,i)=><div key={s.section_key} className="space-y-2"><input aria-label="Section title" value={s.title} onChange={e=>setSections(prev=>prev.map((p,j)=>i===j?{...p,title:e.target.value}:p))} className="bg-transparent text-lg font-bold text-white" /><WikiRichEditor pageId={page?.id} value={s.content_html} onChange={html=>setSections(prev=>prev.map((p,j)=>i===j?{...p,content_html:html}:p))} /><button type="button" className="text-red-400 text-xs" onClick={()=>setSections(prev=>prev.filter((_,j)=>i!==j))}>Remove section</button></div>)}
      <button type="button" className="text-vital-400 text-sm" onClick={()=>setSections(prev=>[...prev,{ section_key:crypto.randomUUID(), title:'New Section', content_html:'', sort_order:prev.length+1 }])}>Add section</button>
      <div className="flex gap-4"><button disabled={busy || !title.trim() || !type || (!creating && !canEdit)} type="button" onClick={save} className="px-5 py-3 rounded-xl bg-vital-500 text-white disabled:opacity-50">{busy?'Saving…':creating?'Create Page':'Save Changes'}</button>{!creating && <button type="button" onClick={()=>setEditing(false)} className="text-gray-400">Cancel</button>}</div>
    </div> : page && <>
      <p className="text-gray-400 text-sm capitalize">{page.entity_type}</p>{canEdit && <button type="button" onClick={()=>setEditing(true)} className="text-vital-400 text-sm">Edit Page</button>}
      {page.sections.filter(s=>!s.is_hidden).map(s=><section id={s.section_key} key={s.section_key} className="p-6 bg-dark-900/50 border border-white/10 rounded-2xl space-y-3"><h2 className="text-xl font-bold">{s.title}</h2><div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html:renderWikiHtml(s.content_html,page.wiki_links || []) }} /></section>)}
      <section id="backlinks" className="space-y-3"><h2 className="text-xl font-bold">Referenced By</h2><CharacterBacklinks backlinks={page.backlinks || []} characterName={page.title} characterSlug={page.slug} entityType={page.entity_type} /></section>
      {canEdit && <section className="space-y-3 border-t border-white/10 pt-6"><h2 className="text-xl font-bold">Wiki Links</h2><WikiLinkManager sourceId={page.id} onUpdated={load} /></section>}
    </>}
  </main><Footer /></div>;
}
