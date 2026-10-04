import type { Firestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { WikiEntityDetail, WikiLink, WikiBacklink, WikiLinkAudit } from './types';
import { entityNames, exactCandidates, ingestSections, isPublicPage, linkAudit, mentionMarker } from './link-core';

const stripUndefined = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const pageFromSnapshot = (doc: { id: string; data(): any }): WikiEntityDetail => ({ ...doc.data(), id: doc.data().id || doc.id });
function allPages(catalog: WikiEntityDetail[], characters: WikiEntityDetail[]): WikiEntityDetail[] {
  const byId = new Map(characters.map(p => [p.id, p]));
  catalog.forEach(p => byId.set(p.id, p));
  return [...byId.values()];
}
export class WikiConflictError extends Error {}
export type LinkEdit = { id: string; action: 'target' | 'remove' | 'leave'; targetId?: string; displayName?: string };

/** One graph for every entity type; relationships are never written here. */
export async function commitWikiPage(db: Firestore, input: WikiEntityDetail, actor: string | null, options: { deleting?: boolean; create?: boolean; linkEdit?: LinkEdit; importOnly?: boolean } = {}): Promise<WikiEntityDetail> {
  if (!input.title?.trim() || input.title.length > 200 || !Array.isArray(input.sections) || input.sections.length > 100 || !input.id || input.id.includes('/')) throw new WikiConflictError('Invalid Wiki page data.');
  const sectionKeys = new Set<string>();
  for (const section of input.sections) {
    if (!section || typeof section.section_key !== 'string' || !section.section_key || sectionKeys.has(section.section_key) || typeof section.content_html !== 'string' || typeof section.title !== 'string') throw new WikiConflictError('Each section needs a unique key, a title, and HTML content.');
    if (section.content_html.length > 200000) throw new WikiConflictError('This Wiki section is too large.');
    sectionKeys.add(section.section_key);
  }
  return db.runTransaction(async tx => {
    // Serializes catalog/name changes with all graph saves, including concurrent exact matches.
    const lockRef = db.collection('wiki_graph').doc('state');
    const lock = await tx.get(lockRef);
    const catalog = await tx.get(db.collection('wiki_pages'));
    const legacy = await tx.get(db.collection('wiki_characters'));
    const pages = allPages(catalog.docs.map(pageFromSnapshot), legacy.docs.map(pageFromSnapshot));
    const existing = pages.find(p => p.id === input.id);
    if (options.create && (existing || pages.some(p => p.entity_type === input.entity_type && p.slug === input.slug))) throw new WikiConflictError('This Wiki page already exists. Please retry with a different slug.');
    if (!options.create && !options.importOnly && !existing) throw new WikiConflictError('This Wiki page no longer exists.');
    if (options.linkEdit && existing) input = existing;
    let page = stripUndefined({ ...input,
      created_by_discord_id: existing?.created_by_discord_id || input.created_by_discord_id,
      created_by_user_id: existing?.created_by_user_id || input.created_by_user_id,
      editor_user_ids: existing?.editor_user_ids || [],
      created_at: existing?.created_at || input.created_at,
      aliases: [...new Set([...(input.aliases || []), ...(input.character?.aliases || []), ...(existing && existing.title !== input.title ? [existing.title] : [])])],
    });
    delete page.wiki_links;
    delete page.backlinks;
    const sourceSnap = await tx.get(db.collection('wiki_links').where('source_page_id', '==', page.id));
    const previous = sourceSnap.docs.map(d => d.data() as WikiLink);
    const names = entityNames(page);
    const pending: WikiLink[] = [];
    for (let start = 0; start < names.length; start += 30) {
      const snap = await tx.get(db.collection('wiki_links').where('normalized_name', 'in', names.slice(start, start + 30)));
      pending.push(...snap.docs.map(d => d.data() as WikiLink).filter(l => l.status === 'unresolved' && l.source_page_id !== page.id));
    }
    const incomingSnap = await tx.get(db.collection('wiki_links').where('target_page_id', '==', page.id));
    const now = new Date().toISOString();
    page.updated_at = now;
    const ingested = ingestSections(page, previous, now, randomUUID);
    page.sections = ingested.sections;
    let outgoing = options.deleting ? [] : ingested.links;
    const audits: WikiLinkAudit[] = [];
    const edit = options.linkEdit;
    if (edit) {
      const old = previous.find(l => l.id === edit.id);
      const link = outgoing.find(l => l.id === edit.id);
      if (!old || !link) throw new WikiConflictError('This link was removed by another edit. Reload the page.');
      if (edit.action === 'remove') {
        outgoing = outgoing.filter(l => l.id !== edit.id);
        page.sections = page.sections.map(s => ({ ...s, content_html: s.content_html.replace(mentionMarker(link), link.display_name.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))) }));
      } else if (edit.action === 'target') {
        const target = pages.find(p => p.id === edit.targetId && isPublicPage(p));
        if (!target) throw new WikiConflictError('The selected target is unavailable.');
        if (edit.displayName !== undefined) {
          if (!edit.displayName.trim() || edit.displayName.length > 200) throw new WikiConflictError('Visible text must be 1–200 characters.');
          link.display_name = edit.displayName.trim();
        }
        link.target_page_id = target.id;
        link.expected_entity_type = target.entity_type;
        link.status = 'resolved';
        link.resolution_method = 'manual';
        link.resolved_by_user_id = actor;
        link.resolved_at = now;
        audits.push(linkAudit(old, link, 'manual', actor, now));
      }
      // "Leave unresolved" explicitly does not pick a candidate.
    }
    const candidates = pages.filter(p => p.id !== page.id);
    if (!options.deleting) candidates.push(page);
    const resolve = (link: WikiLink, old?: WikiLink) => {
      if (link.target_page_id) {
        const target = candidates.find(p => p.id === link.target_page_id && isPublicPage(p));
        link.status = target ? 'resolved' : 'broken';
        if (old && old.status !== 'broken' && link.status === 'broken') audits.push(linkAudit(old, link, 'broken', null, now));
        if (!old || old.target_page_id !== link.target_page_id) {
          link.resolution_method = 'manual'; link.resolved_by_user_id = actor; link.resolved_at = now;
          if (!edit || edit.id !== link.id) audits.push(linkAudit(old, link, 'manual', actor, now));
        }
      } else if (!(edit?.id === link.id && edit.action === 'leave')) {
        const matches = exactCandidates(link, candidates);
        if (matches.length === 1) {
          link.target_page_id = matches[0].id; link.status = 'resolved'; link.resolution_method = 'automatic'; link.resolved_by_user_id = null; link.resolved_at = now;
          audits.push(linkAudit(old, link, 'automatic', null, now));
        }
      }
      link.updated_at = now;
      delete link.target; delete link.source; delete link.potential_matches;
      return link;
    };
    outgoing.forEach(l => resolve(l, previous.find(p => p.id === l.id)));
    const changes = new Map<string, WikiLink>();
    for (const link of [...pending, ...incomingSnap.docs.map(d => d.data() as WikiLink)]) {
      if (link.source_page_id === page.id) continue;
      const old = { ...link };
      resolve(link, old);
      if (old.status !== link.status || old.target_page_id !== link.target_page_id) changes.set(link.id, link);
    }
    // Persist canonical IDs in markers and structured section metadata. An auto-resolved
    // reference on another page is hydrated from wiki_links; no source rewrite is needed.
    page.sections = page.sections.map(s => {
      const ids = new Set(outgoing.filter(l => l.section_key === s.section_key).map(l => l.id));
      return { ...s, content_json: { version: 1, wiki_link_ids: [...ids] }, content_html: s.content_html.replace(/<span\b[^>]*data-wiki-link-id="([^"]+)"[^>]*>[^<]*<\/span>/gi, (whole, id) => { const l = outgoing.find(x => x.id === id); return l ? mentionMarker(l) : whole; }) };
    });
    const context = new Map(ingestSections(page, outgoing, now, randomUUID).links.map(l => [l.id, l.context_snippet]));
    outgoing.forEach(l => { l.context_snippet = context.get(l.id) || l.context_snippet; });
    const removed = previous.filter(l => !outgoing.some(n => n.id === l.id));
    removed.forEach(l => audits.push(linkAudit(l, { ...l, target_page_id: null }, 'removed', actor, now)));
    // Fail the entire edit instead of publishing a partial graph above transaction limits.
    if (outgoing.length + changes.size + removed.length + audits.length + 3 > 450) throw new Error('This change affects too many links for one transaction. Contact a Wiki administrator.');
    if (options.deleting) {
      tx.delete(db.collection('wiki_pages').doc(page.id));
      if (page.entity_type === 'character') tx.delete(db.collection('wiki_characters').doc(page.slug));
    } else {
      tx.set(db.collection('wiki_pages').doc(page.id), stripUndefined({ ...page, normalized_names: entityNames(page) }));
      if (page.entity_type === 'character') tx.set(db.collection('wiki_characters').doc(page.slug), stripUndefined(page));
    }
    outgoing.forEach(l => tx.set(db.collection('wiki_links').doc(l.id), stripUndefined(l)));
    changes.forEach(l => tx.set(db.collection('wiki_links').doc(l.id), stripUndefined(l)));
    removed.forEach(l => tx.delete(db.collection('wiki_links').doc(l.id)));
    audits.forEach(a => tx.set(db.collection('wiki_link_audit').doc(randomUUID()), a));
    tx.set(lockRef, { version: (lock.data()?.version || 0) + 1, updated_at: now });
    return page;
  });
}

export async function listWikiEntities(db: Firestore): Promise<WikiEntityDetail[]> {
  const [catalog, legacy] = await Promise.all([db.collection('wiki_pages').get(), db.collection('wiki_characters').get()]);
  return allPages(catalog.docs.map(pageFromSnapshot), legacy.docs.map(pageFromSnapshot));
}
export async function getWikiEntity(db: Firestore, id: string): Promise<WikiEntityDetail | null> {
  if (!id || id.includes('/')) return null;
  const snap = await db.collection('wiki_pages').doc(id).get();
  if (snap.exists) return pageFromSnapshot(snap);
  // Old profiles had non-UUID permanent IDs and slug-keyed documents.
  const legacy = await db.collection('wiki_characters').where('id', '==', id).limit(1).get();
  return legacy.empty ? null : pageFromSnapshot(legacy.docs[0]);
}
export async function getWikiLinks(db: Firestore, sourceId: string): Promise<WikiLink[]> {
  const snap = await db.collection('wiki_links').where('source_page_id', '==', sourceId).get();
  const links = snap.docs.map(d => d.data() as WikiLink);
  const targets = new Map<string, WikiEntityDetail | null>();
  await Promise.all([...new Set(links.map(l => l.target_page_id).filter(Boolean) as string[])].map(async id => targets.set(id, await getWikiEntity(db, id))));
  return links.map(l => {
    const target = l.target_page_id ? targets.get(l.target_page_id) : null;
    return { ...l, target: target && isPublicPage(target) ? { id: target.id, title: target.title, slug: target.slug, entity_type: target.entity_type } : null };
  });
}
export async function getWikiBacklinks(db: Firestore, targetId: string): Promise<WikiBacklink[]> {
  const snap = await db.collection('wiki_links').where('target_page_id', '==', targetId).get();
  const links = snap.docs.map(d => d.data() as WikiLink).filter(l => l.status === 'resolved' && l.source_public && !l.section_hidden);
  const sources = new Map<string, WikiEntityDetail | null>();
  await Promise.all([...new Set(links.map(l => l.source_page_id))].map(async id => sources.set(id, await getWikiEntity(db, id))));
  return links.flatMap(l => {
    const source = sources.get(l.source_page_id);
    if (!source || !isPublicPage(source)) return [];
    return [{ id: l.id, source_page_id: l.source_page_id, target_page_id: targetId, section_key: l.section_title || l.section_key, context_snippet: l.context_snippet, created_at: l.created_at, updated_at: l.updated_at,
      source: { id: source.id, slug: source.slug, title: source.title, full_name: source.title, avatar_url: source.character?.avatar_url || '', status: source.status, entity_type: source.entity_type } }];
  });
}
