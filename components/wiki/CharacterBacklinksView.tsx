'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { BacklinkSkeleton } from './WikiSkeletons';
import { WikiBacklink } from '../../lib/wiki/types';
import { ArrowLeft, Link2, ArrowUpRight, Compass } from 'lucide-react';
import { getFallbackCharacterBySlug } from '../../data/wiki-fallback';

interface CharacterBacklinksViewProps {
  slug: string;
}

export const CharacterBacklinksView: React.FC<CharacterBacklinksViewProps> = ({ slug }) => {
  const [characterName, setCharacterName] = useState(slug);
  const [backlinks, setBacklinks] = useState<WikiBacklink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/wiki/characters/${slug}/backlinks`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          if (data?.pageTitle) setCharacterName(data.pageTitle);
          if (data?.backlinks) setBacklinks(data.backlinks);
        }
      })
      .catch(() => {
        const fallback = getFallbackCharacterBySlug(slug);
        if (isMounted && fallback) {
          setCharacterName(fallback.title);
          setBacklinks(fallback.backlinks || []);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/5">
          <a
            href={`/wiki/characters/${slug}`}
            className="p-2 rounded-xl bg-dark-900 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </a>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-tech text-vital-400 uppercase tracking-widest">
              <Link2 size={13} />
              <span>Backlink Graph</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              What Links to {characterName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              All Wiki pages, biographies, and section references mentioning this character.
            </p>
          </div>
        </div>

        {/* Backlinks List */}
        {loading ? (
          <div className="space-y-4">
            <BacklinkSkeleton />
            <BacklinkSkeleton />
            <BacklinkSkeleton />
          </div>
        ) : backlinks.length > 0 ? (
          <div className="space-y-3">
            {backlinks.map((b) => {
              const src = b.source;
              const srcSlug = src?.slug || '#';
              const srcName = src?.full_name || src?.title || 'Unknown Character';

              return (
                <a
                  key={b.id}
                  href={`/wiki/characters/${srcSlug}`}
                  className="group block bg-dark-900/60 hover:bg-dark-900/90 border border-white/5 hover:border-vital-500/30 rounded-2xl p-5 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={
                          src?.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            srcName
                          )}&background=f97316&color=fff`
                        }
                        alt={srcName}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-display font-bold text-white group-hover:text-vital-400 transition-colors">
                            {srcName}
                          </span>
                          <span className="text-[10px] font-tech uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                            Section: {b.section_key}
                          </span>
                        </div>
                        {src?.gang && (
                          <div className="text-xs font-tech text-vital-400 mt-0.5">
                            {src.gang}
                          </div>
                        )}
                      </div>
                    </div>

                    <ArrowUpRight size={18} className="text-gray-500 group-hover:text-vital-400 transition-colors shrink-0" />
                  </div>

                  {b.context_snippet && (
                    <p className="mt-3 text-xs sm:text-sm text-gray-300 italic bg-black/25 p-3 rounded-xl border border-white/[0.04] leading-relaxed">
                      &ldquo;{b.context_snippet}&rdquo;
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-dark-900/40 border border-white/5 rounded-3xl space-y-2">
            <div className="text-base font-bold text-white">No incoming backlinks</div>
            <p className="text-xs text-gray-400">
              No other characters have mentioned {characterName} in their bios or sections yet.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
