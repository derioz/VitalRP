'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { ScrollToTop } from '../ScrollToTop';
import { AdminControls } from '../AdminControls';
import { CharacterInfobox } from './CharacterInfobox';
import { CharacterRelationships } from './CharacterRelationships';
import { CharacterGallery } from './CharacterGallery';
import { CharacterBacklinks } from './CharacterBacklinks';
import { CharacterPageSkeleton } from './WikiSkeletons';
import { WikiCharacterDetail } from '../../lib/wiki/types';
import { renderRichHtmlWithMentions } from './WikiMentions';
import { useAuth } from '../AuthProvider';
import { getApiUrl } from '../../lib/api-config';
import { getFallbackCharacterBySlug } from '../../data/wiki-fallback';
import { getLocalCharacterBySlug } from '../../lib/wiki/storage';
import {
  Edit3,
  History,
  Share2,
  Users,
  Compass,
  Check,
  ChevronRight,
  ExternalLink,
  Shield,
  Briefcase,
  Link2,
} from 'lucide-react';

interface CharacterPageViewProps {
  slug: string;
  initialData?: WikiCharacterDetail | null;
}

export const CharacterPageView: React.FC<CharacterPageViewProps> = ({
  slug,
  initialData,
}) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [characterData, setCharacterData] = useState<WikiCharacterDetail | null>(() => {
    if (initialData) return initialData;
    if (typeof window !== 'undefined') {
      return getLocalCharacterBySlug(slug);
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !initialData && !getLocalCharacterBySlug(slug));
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCharacterData(initialData);
      setLoading(false);
      return;
    }

    let isMounted = true;

    fetch(getApiUrl(`/api/wiki/characters/${slug}`))
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('application/json')) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (data.redirect && data.newSlug) {
          window.location.replace(`/wiki/characters/${data.newSlug}`);
          return;
        }
        if (isMounted) setCharacterData(data);
      })
      .catch(() => {
        const localChar = getLocalCharacterBySlug(slug);
        const fallback = localChar || getFallbackCharacterBySlug(slug);
        if (isMounted) setCharacterData(fallback || null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, initialData]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Ownership check: matches Discord ID, User ID, or registered player name
  const isCreator = Boolean(
    user &&
      ((characterData?.created_by_discord_id &&
        user.discordId &&
        characterData.created_by_discord_id === user.discordId) ||
        ((characterData as any)?.created_by_user_id &&
          user.id &&
          (characterData as any).created_by_user_id === user.id) ||
        (characterData?.character?.player_name &&
          (user.displayName || user.username) &&
          characterData.character.player_name.trim().toLowerCase() ===
            (user.displayName || user.username || '').trim().toLowerCase()))
  );

  // Exact rule:
  // "When somebody views a character profile, only show the Edit Character button if they actually have permission to edit that character.
  // If the visitor is logged out, do not show editing controls.
  // If the visitor is logged in but does not own the character, do not show editing controls.
  // The character profile itself must still remain completely visible in both cases."
  const canEdit = Boolean(
    user &&
    (isSuperAdmin ||
      isAdmin ||
      user.effectivePermissions?.includes('wiki.moderate') ||
      isCreator)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
        <Navbar />
        <AdminControls />
        <main className="flex-1">
          <CharacterPageSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (!characterData) {
    return (
      <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
        <Navbar />
        <AdminControls />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-36 pb-20 text-center space-y-6">
          <h1 className="text-3xl font-display font-bold text-white">Character Not Found</h1>
          <p className="text-gray-400 text-sm">
            The requested character profile does not exist or may have been archived.
          </p>
          <a
            href="/wiki/characters"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vital-500 text-white font-tech font-bold text-xs uppercase"
          >
            Return to Character Directory
          </a>
        </main>
        <Footer />
      </div>
    );
  }

  const { character, sections, categories, relationships, gallery, backlinks, related_characters } =
    characterData;

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
      <Navbar />
      <AdminControls />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">
        {/* Breadcrumb Navigation & Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-xs font-tech text-gray-400">
            <a href="/wiki" className="hover:text-white transition-colors">
              Wiki
            </a>
            <span>/</span>
            <a href="/wiki/characters" className="hover:text-white transition-colors">
              Characters
            </a>
            <span>/</span>
            <span className="text-vital-400 font-bold">{character.full_name}</span>
          </div>

          {/* Action Buttons (Edit, History, Share) */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {canEdit && (
              <a
                href={`/wiki/characters/${characterData.slug}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-vital-500/10 hover:bg-vital-500/20 text-vital-400 border border-vital-500/30 text-xs font-tech font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                <Edit3 size={13} />
                <span>Edit Character</span>
              </a>
            )}

            <a
              href={`/wiki/characters/${characterData.slug}/history`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800/60 hover:bg-dark-800 text-gray-300 hover:text-white border border-white/10 text-xs font-tech font-bold uppercase tracking-wider transition-colors"
              title="View Revision History"
            >
              <History size={13} />
              <span>History</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800/60 hover:bg-dark-800 text-gray-300 hover:text-white border border-white/10 text-xs font-tech font-bold uppercase tracking-wider transition-colors"
            >
              {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Desktop 2-Column Layout / Mobile Collapsed Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Biography & Content Sections (8 Columns Left) */}
          <div className="lg:col-span-8 flex flex-col gap-8 order-2 lg:order-1">
            {/* Character Header Hero Banner */}
            <div className="bg-dark-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`/wiki/categories/${cat.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-tech font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-colors"
                  >
                    <span>{cat.name}</span>
                  </a>
                ))}
              </div>

              <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
                {character.full_name}
              </h1>

              {character.aliases && character.aliases.length > 0 && (
                <div className="text-sm font-tech text-vital-400 font-bold mt-1">
                  Also known as: {character.aliases.join(', ')}
                </div>
              )}

              {characterData.summary && (
                <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed">
                  {characterData.summary}
                </p>
              )}
            </div>

            {/* Structured Rich-Text Content Sections */}
            {sections && sections.length > 0 ? (
              sections
                .filter((s) => !s.is_hidden)
                .map((sec) => (
                  <section
                    key={sec.section_key}
                    id={sec.section_key}
                    className="bg-dark-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4"
                  >
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-white border-b border-white/5 pb-3">
                      {sec.title}
                    </h2>
                    <div className="text-gray-300 text-sm sm:text-base leading-relaxed prose prose-invert max-w-none space-y-3">
                      {renderRichHtmlWithMentions(sec.content_html)}
                    </div>
                  </section>
                ))
            ) : null}

            {/* Relationships Section */}
            <section id="relationships" className="bg-dark-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                  <Users size={20} className="text-vital-400" />
                  <span>Relationships</span>
                </h2>
              </div>
              <CharacterRelationships relationships={relationships} />
            </section>

            {/* FiveManage Photo Gallery */}
            {gallery && gallery.length > 0 && (
              <section id="gallery" className="bg-dark-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-5">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white border-b border-white/5 pb-3">
                  Photo Gallery
                </h2>
                <CharacterGallery images={gallery} characterName={character.full_name} />
              </section>
            )}

            {/* Backlinks / "What Links Here" Section */}
            <section id="backlinks" className="bg-dark-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                  <Link2 size={20} className="text-vital-400" />
                  <span>Referenced By (What Links Here)</span>
                </h2>
              </div>
              <CharacterBacklinks
                backlinks={backlinks || []}
                characterSlug={characterData.slug}
                characterName={character.full_name}
              />
            </section>

            {/* Related / Connected Characters */}
            {related_characters && related_characters.length > 0 && (
              <section className="bg-dark-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-5">
                <h2 className="text-xl font-display font-bold text-white border-b border-white/5 pb-3">
                  Connected Characters
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {related_characters.map((rc) => (
                    <a
                      key={rc.id}
                      href={`/wiki/characters/${rc.slug}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-dark-800/40 hover:bg-dark-800/80 border border-white/5 hover:border-vital-500/30 transition-all group"
                    >
                      <img
                        src={
                          rc.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            rc.full_name
                          )}&background=f97316&color=fff`
                        }
                        alt={rc.full_name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold font-display text-white group-hover:text-vital-400 truncate">
                          {rc.full_name}
                        </div>
                        {rc.gang && (
                          <div className="text-[10px] text-vital-400 font-tech truncate">
                            {rc.gang}
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Infobox Column (4 Columns Right, sticky on desktop) */}
          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="lg:sticky lg:top-28">
              <CharacterInfobox
                character={character}
                status={characterData.status}
                pageViews={characterData.page_views}
                updatedAt={characterData.updated_at}
              />
            </div>
          </div>
        </div>
      </main>

      <ScrollToTop />
      <Footer />
    </div>
  );
};
