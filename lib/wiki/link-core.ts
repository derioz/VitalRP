import sanitizeHtml from 'sanitize-html';
import { WikiEntityDetail, WikiLink, WikiLinkAudit, WikiSection, WikiEntityType } from './types';

export const WIKI_ENTITY_TYPES = ['character', 'business', 'gang', 'faction', 'organization', 'department', 'government', 'location', 'event'];
export const isPublicPage = (page: Pick<WikiEntityDetail, 'is_draft' | 'is_archived' | 'status'>) => !page.is_draft && !page.is_archived && page.status !== 'archived';
export function normalizeWikiName(name: string): string {
  // Preserve punctuation and whole names. No prefixes, token matching, or fuzzy matching.
  return name.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();
}
export function entityNames(page: WikiEntityDetail): string[] {
  return [...new Set([page.title, ...(page.aliases || []), ...(page.character?.aliases || [])].map(normalizeWikiName).filter(Boolean))];
}
export function wikiEntityHref(page: { id: string; slug?: string; entity_type?: WikiEntityType }): string {
  if (page.entity_type === 'character') return `/wiki/characters/${encodeURIComponent(page.slug || page.id)}`;
  const plural: Record<string, string> = { business: 'businesses', gang: 'gangs', organization: 'organizations', faction: 'factions', department: 'departments', government: 'government', location: 'locations', event: 'events' };
  return `/wiki/${plural[page.entity_type || ''] || 'entities'}/${encodeURIComponent(page.id)}`;
}
export function creationHref(name: string, type: string | null): string {
  return `/wiki/entities/new?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type || '')}`;
}
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
export function cleanWikiHtml(html: string): string {
  return sanitizeHtml(html || '', {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'h1', 'h2', 'span'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      span: ['data-wiki-link-id', 'data-entity-id', 'data-entity-type', 'data-mention-name', 'data-character-id', 'data-character-name', 'data-character-slug', 'class', 'contenteditable'],
      img: ['src', 'alt', 'class'], '*': ['class'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
  });
}
const markerPattern = () => /<span\b([^>]*)>([^<]*)<\/span>/gi;
function attributes(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  raw.replace(/([\w-]+)="([^"]*)"/g, (_, key, value) => { result[key] = decodeText(value); return ''; });
  return result;
}
export function decodeText(text: string): string {
  // sanitize-html's textFilter receives decoded text via its HTML parser.
  let decoded = '';
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {}, textFilter: value => { decoded += value; return value; } });
  return decoded.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
export function mentionMarker(link: Pick<WikiLink, 'id' | 'display_name' | 'target_page_id' | 'expected_entity_type'> & Partial<Pick<WikiLink, 'original_mention_text'>>): string {
  const mentionName = link.original_mention_text?.replace(/^@/, '') || link.display_name;
  return `<span data-wiki-link-id="${escapeHtml(link.id)}" data-entity-id="${escapeHtml(link.target_page_id || '')}" data-entity-type="${escapeHtml(link.expected_entity_type || '')}" data-mention-name="${escapeHtml(mentionName)}" contenteditable="false" class="vital-mention font-semibold cursor-pointer ${link.target_page_id ? 'text-vital-400' : 'text-amber-300 underline decoration-dotted underline-offset-4'}">${escapeHtml(link.display_name)}</span>`;
}
export function exactCandidates(link: Pick<WikiLink, 'normalized_name' | 'expected_entity_type'>, pages: WikiEntityDetail[]): WikiEntityDetail[] {
  return pages.filter(p => isPublicPage(p) && (!link.expected_entity_type || p.entity_type === link.expected_entity_type) && entityNames(p).includes(link.normalized_name));
}
export function linkAudit(previous: WikiLink | undefined, next: WikiLink, method: WikiLinkAudit['method'], actor: string | null, now: string): WikiLinkAudit {
  return { link_id: next.id, source_page_id: next.source_page_id, previous_unresolved_text: previous?.original_mention_text || next.original_mention_text, previous_target_page_id: previous?.target_page_id || null, resolved_entity_id: next.target_page_id, method, resolved_by_user_id: actor, resolved_at: now };
}
/** Called only on writes/import, never to discover links on public page reads. */
export function ingestSections(page: WikiEntityDetail, previous: WikiLink[], now: string, newId: () => string): { sections: WikiSection[]; links: WikiLink[] } {
  const links: WikiLink[] = [];
  const used = new Set<string>();
  const sections = (page.sections || []).map(section => {
    const clean = cleanWikiHtml(section.content_html);
    const content_html = clean.replace(markerPattern(), (whole, raw, text, offset) => {
      const attrs = attributes(raw);
      if (!attrs['data-wiki-link-id'] && !attrs['data-character-id'] && !attrs['data-entity-id']) return whole;
      let id = attrs['data-wiki-link-id'];
      const legacyId = attrs['data-character-id'];
      const legacyPrevious = previous.find(p => !used.has(p.id) && p.section_key === section.section_key && p.target_page_id === legacyId && p.display_name === decodeText(text).replace(/^@/, ''));
      if (!id || used.has(id) || !previous.some(p => p.id === id) || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) id = legacyPrevious?.id || newId();
      used.add(id);
      const old = previous.find(p => p.id === id);
      const display_name = decodeText(text).replace(/^@/, '').trim();
      if (!display_name) return '';
      const target = attrs['data-entity-id'] || legacyId || null;
      // A stale editor must not undo a resolution performed since it opened.
      const target_page_id = target || old?.target_page_id || null;
      const mentionName = attrs['data-mention-name'] || attrs['data-character-name'] || display_name;
      const expected_entity_type = attrs['data-entity-type'] || (legacyId ? 'character' : null);
      const prefix = decodeText(clean.slice(0, offset)).replace(/\s+/g, ' ').slice(-50);
      const suffix = decodeText(clean.slice(offset + whole.length)).replace(/\s+/g, ' ').slice(0, 70);
      const link: WikiLink = {
        id, source_page_id: page.id, display_name, normalized_name: normalizeWikiName(mentionName), expected_entity_type,
        section_key: section.section_key, section_title: section.title,
        original_mention_text: old?.original_mention_text || `@${mentionName}`, context_snippet: `${prefix}${display_name}${suffix}`.trim(),
        created_at: old?.created_at || now, updated_at: now, target_page_id,
        status: target_page_id ? 'resolved' : 'unresolved', resolution_method: old?.resolution_method || (target ? 'manual' : null),
        resolved_by_user_id: old?.resolved_by_user_id || null, resolved_at: old?.resolved_at || null,
        source_public: isPublicPage(page), section_hidden: Boolean(section.is_hidden),
      };
      links.push(link);
      return mentionMarker(link);
    });
    return { ...section, page_id: page.id, content_html, content_json: { version: 1, wiki_link_ids: links.filter(l => l.section_key === section.section_key).map(l => l.id) } };
  });
  return { sections, links };
}
/** Hydrate markers from the persisted graph, preserving paragraphs and custom visible text. */
export function renderWikiHtml(html: string, links: WikiLink[]): string {
  const byId = new Map(links.map(l => [l.id, l]));
  return cleanWikiHtml(html).replace(markerPattern(), (whole, raw, text) => {
    const attrs = attributes(raw);
    const link = byId.get(attrs['data-wiki-link-id']);
    if (!link) {
      if (attrs['data-character-id']) return `<a class="text-vital-400 underline" href="/wiki/characters/${encodeURIComponent(attrs['data-character-id'])}">${escapeHtml(decodeText(text).replace(/^@/, '') || attrs['data-character-name'] || 'Wiki page')}</a>`;
      return whole;
    }
    const resolved = link.status === 'resolved' && link.target;
    const href = resolved ? wikiEntityHref(link.target!) : `/wiki/wanted?reference=${encodeURIComponent(link.normalized_name)}&type=${encodeURIComponent(link.expected_entity_type || '')}`;
    const label = resolved ? link.target!.title : link.status === 'broken' ? 'Target page is unavailable' : 'This Wiki page has not been created yet';
    return `<a href="${escapeHtml(href)}" title="${escapeHtml(label)}" class="font-semibold ${resolved ? 'text-vital-400 hover:text-vital-300 underline decoration-vital-500/40' : 'text-amber-300/80 hover:text-amber-200 underline decoration-dotted underline-offset-4'}">${escapeHtml(link.display_name)}</a>`;
  });
}
