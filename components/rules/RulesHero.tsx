import React from 'react';
import { Search, Clock } from 'lucide-react';
import type { RulesHeroConfig } from '@/lib/rules/client-rules-service';

interface RulesHeroProps {
  onOpenSearch: () => void;
  lastUpdatedAt?: string | null;
  heroConfig?: RulesHeroConfig | null;
}

/**
 * Compact header for the rules page.
 */
export const RulesHero: React.FC<RulesHeroProps> = ({
  onOpenSearch,
  lastUpdatedAt,
  heroConfig,
}) => {
  const title = heroConfig?.title || 'Server rules';
  const subtitle =
    heroConfig?.subtitle !== undefined
      ? heroConfig.subtitle
      : '';
  const description =
    heroConfig?.description ||
    'Read these before you play. Roleplay comes before ruleplay, and common sense is expected.';
  const pillars =
    heroConfig?.pillars && heroConfig.pillars.length > 0
      ? heroConfig.pillars
      : [];

  const displayUpdatedDate = React.useMemo(() => {
    if (heroConfig?.updatedDateOverride && heroConfig.updatedDateOverride.trim()) {
      const val = heroConfig.updatedDateOverride.trim();
      return val.toLowerCase().startsWith('updated:') ? val : `Updated: ${val}`;
    }
    if (lastUpdatedAt) {
      try {
        const d = new Date(lastUpdatedAt);
        if (!isNaN(d.getTime())) {
          return `Updated: ${d.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}`;
        }
      } catch {}
    }
    return 'Updated: September 2026';
  }, [lastUpdatedAt, heroConfig?.updatedDateOverride]);

  return (
    <div className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 overflow-hidden border-b border-white/10 bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white tracking-tight mb-3">
          {title}
        </h1>

        <p className="inline-flex items-center gap-1.5 text-sm font-tech text-gray-300 mb-4">
          <Clock className="w-4 h-4 text-vital-500" />
          <span>{displayUpdatedDate}</span>
        </p>

        {/* Lead Quote */}
        {subtitle && (
          <p className="text-base sm:text-xl font-display font-medium text-gray-100 max-w-2xl mb-4">
            {subtitle.startsWith('“') || subtitle.startsWith('"') ? subtitle : `“${subtitle}”`}
          </p>
        )}

        {/* Description & Pillars */}
        {description && (
          <p className="text-base font-sans text-gray-300 max-w-2xl leading-relaxed mb-8">
            {description}
          </p>
        )}

        {/* Pillars Chips */}
        {pillars.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-sm font-tech text-gray-300">
            {pillars.map((pillar, idx) => {
              const isLast = idx === pillars.length - 1;
              return (
                <span
                  key={idx}
                  className={`px-2.5 py-1 rounded border border-white/10 text-gray-200`}
                >
                  {pillar.replace(/^[•\-\*]\s*/, '')}
                </span>
              );
            })}
          </div>
        )}

        {/* Search Bar Input / Trigger */}
        <div className="w-full max-w-xl">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full group flex items-center justify-between px-5 py-3.5 rounded bg-dark-900 border border-white/15 hover:border-vital-500/60 transition-colors duration-150 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Search className="w-5 h-5 text-vital-500 flex-shrink-0" />
              <span className="text-sm font-sans text-gray-300 group-hover:text-white truncate">
                Search rules (RDM, NLR, heists)
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 text-xs font-tech text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded group-hover:text-vital-400 group-hover:border-vital-500/30 transition-colors">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
