import React from 'react';
import { WikiBacklink } from '../../lib/wiki/types';
import { Link2, ArrowUpRight } from 'lucide-react';

interface CharacterBacklinksProps {
  backlinks: WikiBacklink[];
  characterSlug: string;
  characterName: string;
}

export const CharacterBacklinks: React.FC<CharacterBacklinksProps> = ({
  backlinks,
  characterSlug,
  characterName,
}) => {
  if (!backlinks || backlinks.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 bg-white/[0.02] border border-white/5 rounded-2xl">
        No other Wiki pages currently reference {characterName}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {backlinks.map((b) => {
        const src = b.source;
        const srcSlug = src?.slug || '#';
        const srcName = src?.full_name || src?.title || 'Unknown Character';

        return (
          <a
            key={b.id}
            href={`/wiki/characters/${srcSlug}`}
            className="group block bg-dark-900/60 hover:bg-dark-900/90 border border-white/5 hover:border-vital-500/30 rounded-2xl p-4 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={
                    src?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      srcName
                    )}&background=f97316&color=fff`
                  }
                  alt={srcName}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-white group-hover:text-vital-400 transition-colors">
                      {srcName}
                    </span>
                    <span className="text-[10px] font-tech uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      Section: {b.section_key}
                    </span>
                  </div>
                  {src?.gang && (
                    <div className="text-[11px] font-tech text-vital-400 mt-0.5">
                      {src.gang}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-gray-500 group-hover:text-vital-400 transition-colors shrink-0">
                <ArrowUpRight size={16} />
              </div>
            </div>

            {b.context_snippet && (
              <p className="mt-2.5 text-xs text-gray-300/80 italic bg-black/20 p-2.5 rounded-xl border border-white/[0.03] leading-relaxed">
                &ldquo;{b.context_snippet}&rdquo;
              </p>
            )}
          </a>
        );
      })}

      <div className="pt-2 text-right">
        <a
          href={`/wiki/characters/${characterSlug}/backlinks`}
          className="inline-flex items-center gap-1.5 text-xs text-vital-400 hover:text-vital-300 font-tech uppercase tracking-wider font-bold transition-colors"
        >
          <Link2 size={13} />
          <span>View All Backlinks &rarr;</span>
        </a>
      </div>
    </div>
  );
};
