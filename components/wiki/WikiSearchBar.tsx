'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Shield, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { WikiSearchResult } from '../../lib/wiki/types';
import { SearchResultSkeleton } from './WikiSkeletons';
import { getFallbackSearchResults } from '../../data/wiki-fallback';
import { getApiUrl } from '../../lib/api-config';
import { getLocalCharacters } from '../../lib/wiki/storage';

interface WikiSearchBarProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSelect?: (result: WikiSearchResult) => void;
}

export const WikiSearchBar: React.FC<WikiSearchBarProps> = ({
  placeholder = 'Search characters, aliases, gangs, jobs (e.g. Damon Vox)...',
  className = '',
  autoFocus = false,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<WikiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        let apiResults: WikiSearchResult[] = [];
        try {
          const res = await fetch(getApiUrl(`/api/wiki/search?q=${encodeURIComponent(query.trim())}&limit=8`));
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const data = await res.json();
            apiResults = data.results || [];
          }
        } catch {}

        // Search local characters
        const q = query.toLowerCase().trim();
        const localMatches = getLocalCharacters()
          .filter((c) => {
            const nameMatch = (c.character?.full_name || c.title).toLowerCase().includes(q);
            const aliasMatch = (c.character?.aliases || []).some((a) => a.toLowerCase().includes(q));
            const gangMatch = c.character?.gang?.toLowerCase().includes(q);
            const jobMatch = c.character?.occupation?.toLowerCase().includes(q);
            const summaryMatch = c.summary?.toLowerCase().includes(q);
            return nameMatch || aliasMatch || gangMatch || jobMatch || summaryMatch;
          })
          .map((c) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            full_name: c.character?.full_name || c.title,
            aliases: c.character?.aliases || [],
            avatar_url: c.character?.avatar_url,
            status: c.status,
            occupation: c.character?.occupation,
            gang: c.character?.gang,
            business: c.character?.business,
            summary: c.summary,
            categories: c.categories.map((cat) => cat.name),
          }));

        // Merge results
        const resultMap = new Map<string, WikiSearchResult>();
        for (const r of apiResults) resultMap.set(r.slug.toLowerCase(), r);
        for (const r of localMatches) resultMap.set(r.slug.toLowerCase(), r);
        setResults(Array.from(resultMap.values()).slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSelectedIndex(0);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        if (onSelect) {
          onSelect(selected);
        } else {
          window.location.href = `/wiki/characters/${selected.slug}`;
        }
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-4 sm:left-5 text-gray-400 pointer-events-none">
          {loading ? (
            <Loader2 size={20} className="animate-spin text-vital-400" />
          ) : (
            <Search size={20} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full h-13 sm:h-14 pl-12 sm:pl-14 pr-12 rounded-2xl bg-dark-900/90 hover:bg-dark-900 border border-white/10 hover:border-white/20 focus:border-vital-500 text-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-vital-500/20 backdrop-blur-xl shadow-xl transition-all"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-dark-900/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 divide-y divide-white/5">
          {loading ? (
            <div className="p-2 space-y-1">
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
              {results.map((char, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <a
                    key={char.id}
                    href={`/wiki/characters/${char.slug}`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center gap-3.5 p-3 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-vital-500/15 border border-vital-500/30'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <img
                      src={
                        char.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          char.full_name
                        )}&background=f97316&color=fff`
                      }
                      alt={char.full_name}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-white text-sm truncate">
                          {char.full_name}
                        </span>
                        <span
                          className={`text-[10px] font-tech uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            char.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : char.status === 'deceased'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {char.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        {char.gang ? (
                          <span className="flex items-center gap-1 font-tech text-vital-400 font-bold truncate">
                            <Shield size={11} />
                            <span>{char.gang}</span>
                          </span>
                        ) : char.occupation ? (
                          <span className="flex items-center gap-1 text-gray-400 truncate">
                            <Briefcase size={11} />
                            <span>{char.occupation}</span>
                          </span>
                        ) : null}

                        {char.aliases && char.aliases.length > 0 && (
                          <span className="text-gray-500 truncate text-[11px]">
                            • &ldquo;{char.aliases[0]}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight size={15} className="text-gray-500 shrink-0" />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-400">
              No matching characters found for &ldquo;{query}&rdquo;.
            </div>
          )}

          {/* Footer Helper */}
          <div className="px-4 py-2 bg-dark-950/80 flex items-center justify-between text-[11px] text-gray-500 font-tech">
            <span>Use &uarr; &darr; to navigate, Enter to select</span>
            <a
              href={`/wiki/characters?q=${encodeURIComponent(query)}`}
              className="text-vital-400 hover:underline"
            >
              Browse all results &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
