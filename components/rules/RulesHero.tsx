'use client';

import React from 'react';
import { Search, Sparkles, Shield, Clock, BookOpen } from 'lucide-react';

interface RulesHeroProps {
  onOpenSearch: () => void;
}

/**
 * Compact, modern 2026 Documentation Hero for Vital RP Rules.
 * Keeps rules above/near the fold while reinforcing core community expectations.
 */
export const RulesHero: React.FC<RulesHeroProps> = ({ onOpenSearch }) => {
  return (
    <div className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 overflow-hidden border-b border-white/10 bg-dark-950">
      {/* Subtle Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-vital-500/10 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Eyebrow & Last Updated badge */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vital-500/10 border border-vital-500/30 text-vital-400 text-xs font-tech font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-vital-500 animate-pulse" />
            VITAL ROLEPLAY CONSTITUTION
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-tech">
            <Clock className="w-3.5 h-3.5 text-vital-500" />
            <span>Updated: September 2026</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white uppercase tracking-tight mb-3 drop-shadow-sm">
          SERVER <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 via-vital-500 to-vital-600">RULES</span>
        </h1>

        {/* Lead Quote */}
        <p className="text-base sm:text-xl font-display font-medium text-gray-200 tracking-wide max-w-2xl mb-4 italic">
          &ldquo;Serious roleplay works when everyone understands the expectations.&rdquo;
        </p>

        {/* Description & Pillars */}
        <p className="text-xs sm:text-sm font-sans text-gray-400 max-w-2xl leading-relaxed mb-6">
          Vital RP is built on player-driven storytelling, deep immersion, common sense, and putting <span className="text-white font-semibold">roleplay over ruleplay</span>. Familiarize yourself with our server legislation to keep Los Santos authentic and engaging for everyone.
        </p>

        {/* Pillars Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs font-tech text-gray-400">
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-gray-300">
            • Storytelling First
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-gray-300">
            • Quality RP
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-gray-300">
            • Deep Immersion
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-gray-300">
            • Common Sense Expected
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-vital-400 border-vital-500/30">
            • Roleplay Over Ruleplay
          </span>
        </div>

        {/* Search Bar Input / Trigger */}
        <div className="w-full max-w-xl">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full group flex items-center justify-between px-5 py-3.5 rounded-2xl bg-dark-900/90 border border-white/15 hover:border-vital-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-200 cursor-pointer text-left backdrop-blur-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Search className="w-5 h-5 text-vital-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-sans text-gray-400 group-hover:text-gray-200 truncate">
                Search rules, aliases (RDM, FearRP, NLR, Heists, POV)...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-tech text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded-lg group-hover:text-vital-400 group-hover:border-vital-500/30 transition-colors">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
