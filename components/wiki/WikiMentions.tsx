'use client';

import React, { useState, useRef } from 'react';
import { MentionData } from '../../lib/wiki/mentions';
import { Skeleton } from '../ui/skeleton';

export { type MentionData } from '../../lib/wiki/mentions';

/**
 * Interactive Mention Link Component with desktop hover preview card.
 * Handles ID-to-slug mapping so renamed characters never produce broken links.
 */
export const MentionLink: React.FC<{
  characterId: string;
  displayName: string;
  slug?: string;
  characterLookup?: Record<string, MentionData>;
}> = ({ characterId, displayName, slug: initialSlug, characterLookup }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [cardData, setCardData] = useState<MentionData | null>(
    characterLookup?.[characterId] || null
  );
  const [loadingCard, setLoadingCard] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const character = characterLookup?.[characterId] || cardData;
  const activeSlug = character?.slug || initialSlug || characterId;
  const activeName = character?.name || displayName;
  const isArchived = character?.status === 'archived';

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      if (!cardData && !characterLookup?.[characterId]) {
        setLoadingCard(true);
        // Async fetch preview data
        fetch(`/api/wiki/characters/${characterId}?preview=true`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.character) {
              setCardData({
                id: data.id,
                name: data.character.full_name,
                slug: data.slug,
                avatar_url: data.character.avatar_url,
                status: data.status,
                gang: data.character.gang,
                occupation: data.character.occupation,
              });
            }
          })
          .catch(() => {})
          .finally(() => setLoadingCard(false));
      }
    }, 280);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={`/wiki/characters/${activeSlug}`}
        className="inline-flex items-center gap-1 font-semibold text-vital-400 hover:text-vital-300 underline decoration-vital-500/40 hover:decoration-vital-400 transition-colors px-1 py-0.5 rounded bg-vital-500/10 hover:bg-vital-500/20"
      >
        <span>@{activeName}</span>
        {isArchived && <span className="text-[10px] text-gray-500 no-underline">(Archived)</span>}
      </a>

      {/* Desktop Hover Card Preview */}
      {isHovered && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-dark-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-2xl shadow-black/80 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150"
        >
          {loadingCard ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <img
                src={
                  character?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    activeName
                  )}&background=f97316&color=fff`
                }
                alt={activeName}
                className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0 bg-dark-800"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-display font-bold text-white truncate">
                  {activeName}
                </div>
                {character?.gang && (
                  <div className="text-xs text-vital-400 font-tech truncate">
                    {character.gang}
                  </div>
                )}
                {character?.occupation && !character?.gang && (
                  <div className="text-xs text-gray-400 font-tech truncate">
                    {character.occupation}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      character?.status === 'active'
                        ? 'bg-emerald-400'
                        : character?.status === 'deceased'
                        ? 'bg-red-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider capitalize">
                    {character?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
};

/**
 * Parses raw HTML string and transforms <span data-character-id="..."> into interactive MentionLinks.
 */
export function renderRichHtmlWithMentions(
  html: string,
  characterLookup?: Record<string, MentionData>
): React.ReactNode {
  if (!html) return null;

  // Split by mention span tags
  const mentionTagRegex = /<span\s+[^>]*data-character-id="([0-9a-fA-F-]{36})"[^>]*>@?([^<]*)<\/span>/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionTagRegex.exec(html)) !== null) {
    const [fullMatch, characterId, rawName] = match;
    const matchStart = match.index;

    // Push preceding standard HTML
    if (matchStart > lastIndex) {
      const precedingHtml = html.slice(lastIndex, matchStart);
      parts.push(
        <span
          key={`html-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: precedingHtml }}
        />
      );
    }

    // Push interactive mention
    const charName = rawName.trim().replace(/^@/, '') || 'Character';
    parts.push(
      <MentionLink
        key={`mention-${characterId}-${matchStart}`}
        characterId={characterId}
        displayName={charName}
        characterLookup={characterLookup}
      />
    );

    lastIndex = matchStart + fullMatch.length;
  }

  // Push remaining HTML
  if (lastIndex < html.length) {
    const trailingHtml = html.slice(lastIndex);
    parts.push(
      <span
        key={`html-${lastIndex}`}
        dangerouslySetInnerHTML={{ __html: trailingHtml }}
      />
    );
  }

  return <>{parts}</>;
}
