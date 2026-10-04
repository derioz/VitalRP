'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { ScrollToTop } from '../ScrollToTop';
import { AdminControls } from '../AdminControls';
import { WikiSearchBar } from './WikiSearchBar';
import { CharacterCard, CharacterCardData } from './CharacterCard';
import { WikiHomeSkeleton } from './WikiSkeletons';
import { WikiCategory } from '../../lib/wiki/types';
import { useAuth } from '../AuthProvider';
import {
  Users,
  PlusCircle,
  Shuffle,
  Compass,
  Flame,
  Shield,
  Briefcase,
  HeartPulse,
  Building2,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { FALLBACK_CHARACTERS, FALLBACK_WIKI_CATEGORIES } from '../../data/wiki-fallback';
import { getApiUrl } from '../../lib/api-config';
import { getLocalCharacters } from '../../lib/wiki/storage';

export const WikiHomeView: React.FC = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [categories, setCategories] = useState<WikiCategory[]>(FALLBACK_WIKI_CATEGORIES);
  const [recentlyUpdated, setRecentlyUpdated] = useState<CharacterCardData[]>([]);
  const [popularCharacters, setPopularCharacters] = useState<CharacterCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Logged-in users can create Wiki characters
  const canCreate = Boolean(user);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const localList: CharacterCardData[] = getLocalCharacters().map((c) => ({
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
          updated_at: c.updated_at,
        }));

        const [catRes, charRes] = await Promise.all([
          fetch(getApiUrl('/api/wiki/categories'), { cache: 'no-store' }).catch(() => null),
          fetch(getApiUrl('/api/wiki/characters?limit=12&sort=updated_desc'), { cache: 'no-store' }).catch(() => null),
        ]);

        if (catRes && catRes.ok) {
          const ct = catRes.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const catData = await catRes.json();
            if (isMounted && catData.categories?.length) {
              setCategories(catData.categories);
            }
          }
        }

        let apiList: CharacterCardData[] = [];
        if (charRes && charRes.ok) {
          const ct = charRes.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const charData = await charRes.json();
            if (Array.isArray(charData.characters)) {
              apiList = charData.characters;
            }
          }
        }

        // Merge API characters with local characters
        const combinedMap = new Map<string, CharacterCardData>();
        for (const c of apiList) combinedMap.set(c.slug.toLowerCase(), c);
        for (const c of localList) combinedMap.set(c.slug.toLowerCase(), c);
        const combined = Array.from(combinedMap.values());

        if (isMounted) {
          setRecentlyUpdated(combined.slice(0, 4));
          setPopularCharacters(combined.slice(0, 4));
        }
      } catch (err) {
        console.warn('Error loading wiki home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRandomCharacter = () => {
    const pool = recentlyUpdated.length > 0 ? recentlyUpdated : FALLBACK_CHARACTERS;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    if (chosen) {
      window.location.href = `/wiki/characters/${chosen.slug}`;
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'gang':
        return <Flame size={16} className="text-amber-400" />;
      case 'police':
        return <Shield size={16} className="text-blue-400" />;
      case 'ems':
        return <HeartPulse size={16} className="text-red-400" />;
      case 'business':
        return <Briefcase size={16} className="text-emerald-400" />;
      case 'government':
        return <Building2 size={16} className="text-purple-400" />;
      default:
        return <Users size={16} className="text-vital-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
      {/* Universal Floating Navbar */}
      <Navbar />

      <AdminControls />

      <main className="flex-1">
        {loading ? (
          <WikiHomeSkeleton />
        ) : (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-20 space-y-16">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-vital-500/10 border border-vital-500/20 text-vital-400 text-xs font-tech font-bold uppercase tracking-widest shadow-inner">
                <BookOpen size={14} />
                <span>Vital Roleplay Lore & Characters</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-white leading-tight">
                Vital RP <span className="text-vital-500">Character Wiki</span>
              </h1>

              {/* Subtitle */}
              <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Explore the stories, syndicate connections, and player-driven histories shaping
                the living world of Los Santos.
              </p>

              {/* Search Bar Feature */}
              <div className="pt-2 max-w-2xl mx-auto">
                <WikiSearchBar />
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a href="/wiki/entities" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-tech font-bold uppercase border border-white/10">All Wiki Entities</a>
                <a href="/wiki/wanted" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 text-amber-200 text-xs font-tech font-bold uppercase border border-amber-500/20">Wanted Pages</a>
                <a
                  href="/wiki/characters"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-tech font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors shadow-lg"
                >
                  <Compass size={15} className="text-vital-400" />
                  <span>Browse Characters</span>
                </a>

                <button
                  type="button"
                  onClick={handleRandomCharacter}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-800/80 hover:bg-dark-800 text-gray-300 hover:text-white font-tech font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors"
                >
                  <Shuffle size={15} />
                  <span>Random Character</span>
                </button>

                {user ? (
                  <a
                    href="/wiki/characters/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-vital-500/20 transition-all hover:scale-105"
                  >
                    <PlusCircle size={15} />
                    <span>Create Character</span>
                  </a>
                ) : (
                  <a
                    href="/wiki/characters/new"
                    title="Log in to create your character"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-800/80 hover:bg-dark-800 text-gray-300 hover:text-white font-tech font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors"
                  >
                    <PlusCircle size={15} />
                    <span>Create Character</span>
                  </a>
                )}
              </div>
            </div>

            {/* Category Pills Slider / Grid */}
            <div className="space-y-4">
              <div className="text-center text-xs font-tech font-bold uppercase tracking-widest text-gray-400">
                Explore Categories & Affiliations
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-5xl mx-auto">
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`/wiki/categories/${cat.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-900/60 hover:bg-dark-900 border border-white/5 hover:border-vital-500/40 text-gray-300 hover:text-white text-xs font-medium transition-all shadow-sm group"
                  >
                    {getCategoryIcon(cat.slug)}
                    <span>{cat.name}</span>
                    {cat.count !== undefined && cat.count > 0 && (
                      <span className="text-[10px] font-tech text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-full">
                        {cat.count}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Recently Updated Characters */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-vital-500/10 text-vital-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                      Recently Updated
                    </h2>
                    <p className="text-xs text-gray-400">
                      Freshly edited character pages and developments
                    </p>
                  </div>
                </div>

                <a
                  href="/wiki/characters?sort=updated_desc"
                  className="flex items-center gap-1 text-xs text-vital-400 hover:text-vital-300 font-tech font-bold uppercase tracking-wider transition-colors"
                >
                  <span>View All</span>
                  <ChevronRight size={14} />
                </a>
              </div>

              {recentlyUpdated.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {recentlyUpdated.map((char) => (
                    <CharacterCard key={char.id} character={char} />
                  ))}
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-dark-900/40 border border-white/5 text-center space-y-3">
                  <Users size={32} className="mx-auto text-gray-600" />
                  <h3 className="text-base font-display font-semibold text-white">No Characters Registered Yet</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    The Vital Wiki is clean and ready for players. Log in to create the first character pages!
                  </p>
                  <div className="pt-2">
                    <a
                      href="/wiki/characters/new"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vital-500 hover:bg-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-vital-500/20"
                    >
                      <PlusCircle size={14} />
                      <span>Create First Character</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Popular Characters */}
            {popularCharacters.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                        Popular Characters
                      </h2>
                      <p className="text-xs text-gray-400">
                        Most viewed community characters and syndicate leaders
                      </p>
                    </div>
                  </div>

                  <a
                    href="/wiki/characters?sort=popular"
                    className="flex items-center gap-1 text-xs text-vital-400 hover:text-vital-300 font-tech font-bold uppercase tracking-wider transition-colors"
                  >
                    <span>View Directory</span>
                    <ChevronRight size={14} />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {popularCharacters.map((char) => (
                    <CharacterCard key={`pop-${char.id}`} character={char} />
                  ))}
                </div>
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
