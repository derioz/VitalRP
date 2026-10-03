import { CharacterStatus } from './types';

export interface MentionData {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  status?: CharacterStatus;
  gang?: string;
  occupation?: string;
}

/**
 * Extracts all unique character UUIDs mentioned in HTML content
 */
export function extractMentionIds(html: string): string[] {
  if (!html) return [];
  const regex = /data-character-id="([0-9a-fA-F-]{36})"/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) matches.add(match[1]);
  }
  return Array.from(matches);
}

/**
 * Extracts a human-readable context snippet surrounding a mention
 */
export function extractMentionSnippet(html: string, targetId: string, maxLen = 120): string {
  if (!html) return '';
  // Strip HTML tags for clean text search
  const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  
  // Find index or slice middle
  const matchIndex = cleanText.indexOf('@');
  if (matchIndex === -1) {
    return cleanText.slice(0, maxLen).trim() + (cleanText.length > maxLen ? '...' : '');
  }

  const start = Math.max(0, matchIndex - 50);
  const end = Math.min(cleanText.length, matchIndex + 70);
  let snippet = cleanText.slice(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < cleanText.length) snippet = snippet + '...';
  return snippet;
}
