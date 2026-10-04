'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { ScrollToTop } from '../ScrollToTop';
import { AdminControls } from '../AdminControls';
import { CharacterCard, CharacterCardData } from './CharacterCard';
import { CharacterDirectorySkeleton } from './WikiSkeletons';
import { Search, Filter, ArrowUpDown, PlusCircle, Compass } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { FALLBACK_CHARACTERS, FALLBACK_WIKI_CATEGORIES } from '../../data/wiki-fallback';
import { getApiUrl } from '../../lib/api-config';
import { getLocalCharacters } from '../../lib/wiki/storage';

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

const STATUS_FILTERS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Deceased (CK)', value: 'deceased' },
];

const SORT_OPTIONS = [
  { label: 'Name (A - Z)', value: 'name_asc' },
  { label: 'Name (Z - A)', value: 'name_desc' },
  { label: 'Recently Updated', value: 'updated_desc' },
  { label: 'Most Viewed', value: 'popular' },
];

export const CharacterDirectoryView: React.FC<{ initialCategory?: string }> = ({
  initialCategory = 'all',
}) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('name_asc');

  const [characters, setCharacters] = useState<CharacterCardData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Logged-in users can create Wiki characters
  const canCreate = Boolean(user);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    const queryParams = new URLSearchParams();
    if (search.trim()) queryParams.set('q', search.trim());
    if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
    if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
    if (selectedLetter !== 'ALL') queryParams.set('letter', selectedLetter);
    queryParams.set('sort', selectedSort);
    queryParams.set('limit', '32');

    const timer = setTimeout(async () => {
      try {
        let apiCharacters: CharacterCardData[] = [];
        let apiTotal = 0;

        try {
          const res = await fetch(getApiUrl(`/api/wiki/characters?${queryParams.toString()}`), {
            cache: 'no-store',
          });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const data = await res.json();
            apiCharacters = data.characters || [];
            apiTotal = data.total || 0;
          }
        } catch {
          // Ignore network error on static host
        }

        // Apply filters to local characters as well
        let localList = getLocalCharacters();
        if (selectedStatus !== 'all') {
          localList = localList.filter((c) => c.status === selectedStatus);
        }
        if (selectedLetter !== 'ALL') {
          localList = localList.filter((c) =>
            (c.character?.full_name || c.title).toUpperCase().startsWith(selectedLetter)
          );
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          localList = localList.filter(
            (c) =>
              (c.character?.full_name || c.title).toLowerCase().includes(q) ||
              c.character?.gang?.toLowerCase().includes(q) ||
              c.character?.occupation?.toLowerCase().includes(q)
          );
        }

        const mappedLocal: CharacterCardData[] = localList.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          full_name: c.character?.full_name || c.title,
          aliases: c.character?.aliases || [],
          avatar_url: c.character?.avatar_url,
          status: c.status,
          occupation: c.character?.occupation,
          gang: c.character?.gang,
          summary: c.summary,
        }));

        // Merge API characters and local characters
        const map = new Map<string, CharacterCardData>();
        for (const c of apiCharacters) map.set(c.slug.toLowerCase(), c);
        for (const c of mappedLocal) map.set(c.slug.toLowerCase(), c);
        const finalResults = Array.from(map.values());

        if (isCurrent) {
          setCharacters(finalResults);
          setTotalCount(finalResults.length || apiTotal);
        }
      } catch {
        // Safe fallback
      } finally {
        if (isCurrent) setLoading(false);
      }
    }, 150);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [search, selectedStatus, selectedCategory, selectedLetter, selectedSort]);

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
      <Navbar />
      <AdminControls />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-xs font-tech text-vital-400 uppercase tracking-widest mb-1.5">
              <Compass size={14} />
              <span>Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
              Character Directory
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Browse all citizens, criminals, officials, and syndicate leaders.
            </p>
          </div>

          {user ? (
            <a
              href="/wiki/characters/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-vital-500/20 transition-all self-start sm:self-auto"
            >
              <PlusCircle size={15} />
              <span>Create Character</span>
            </a>
          ) : (
            <a
              href="/wiki/characters/new"
              title="Log in to create your character"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white border border-white/10 font-tech font-bold text-xs uppercase tracking-wider transition-colors self-start sm:self-auto"
            >
              <PlusCircle size={15} />
              <span>Create Character</span>
            </a>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-dark-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search characters by name, gang, or occupation..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-dark-800 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-vital-500"
              />
            </div>

            {/* Status Select */}
            <div className="sm:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-vital-500"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Select */}
            <div className="sm:col-span-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-vital-500"
              >
                <option value="all">All Categories</option>
                {FALLBACK_WIKI_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div className="sm:col-span-2">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-vital-500"
              >
                {SORT_OPTIONS.map((so) => (
                  <option key={so.value} value={so.value}>
                    {so.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* A-Z Alphabet Filter Row */}
          <div className="pt-2 border-t border-white/5 flex items-center gap-1 overflow-x-auto pb-1 text-xs font-tech scrollbar-thin">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider mr-1 shrink-0">
              A-Z Index:
            </span>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                  selectedLetter === letter
                    ? 'bg-vital-500 text-white font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count & Active Filters Indicator */}
        <div className="flex items-center justify-between text-xs text-gray-400 font-tech">
          <span>
            Showing <strong className="text-white">{characters.length}</strong> of{' '}
            <strong className="text-white">{totalCount}</strong> characters
          </span>

          {(selectedStatus !== 'all' ||
            selectedCategory !== 'all' ||
            selectedLetter !== 'ALL' ||
            search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedStatus('all');
                setSelectedCategory('all');
                setSelectedLetter('ALL');
              }}
              className="text-vital-400 hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Characters Grid / Skeleton States */}
        {loading ? (
          <CharacterDirectorySkeleton count={8} />
        ) : characters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {characters.map((char) => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-dark-900/40 border border-white/5 rounded-3xl space-y-4">
            <div className="text-lg font-bold text-white">No Characters Found</div>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {search || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedLetter !== 'ALL'
                ? 'No characters matched your active filters. Try loosening your search criteria.'
                : 'No characters have been registered yet. Log in to create the first entry!'}
            </p>
            {!search && selectedStatus === 'all' && selectedCategory === 'all' && selectedLetter === 'ALL' && (
              <div className="pt-2">
                <a
                  href="/wiki/characters/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-vital-500/20"
                >
                  <PlusCircle size={15} />
                  <span>Create First Character</span>
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      <ScrollToTop />
      <Footer />
    </div>
  );
};
