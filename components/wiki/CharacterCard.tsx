import React from 'react';
import { CharacterStatus } from '../../lib/wiki/types';
import { Shield, Briefcase, ArrowUpRight } from 'lucide-react';

export interface CharacterCardData {
  id: string;
  slug: string;
  title: string;
  full_name: string;
  aliases?: string[];
  avatar_url?: string;
  status: CharacterStatus;
  occupation?: string;
  gang?: string;
  business?: string;
  summary?: string;
  categories?: any[];
  updated_at?: string;
}

interface CharacterCardProps {
  character: CharacterCardData;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    deceased: 'bg-red-500/10 text-red-400 border-red-500/30',
    archived: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };

  return (
    <a
      href={`/wiki/characters/${character.slug}`}
      className="group relative h-full bg-dark-900/60 hover:bg-dark-900/90 border border-white/5 hover:border-vital-500/40 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-vital-500/10 hover:-translate-y-1"
    >
      <div>
        {/* Image Container with 4:3 Aspect Ratio */}
        <div className="relative aspect-[4/3] w-full bg-dark-800 overflow-hidden border-b border-white/5">
          <img
            src={
              character.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                character.full_name
              )}&background=f97316&color=fff&size=512`
            }
            alt={character.full_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider border backdrop-blur-md shadow-md ${
                statusColors[character.status] || statusColors.active
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  character.status === 'active'
                    ? 'bg-emerald-400'
                    : character.status === 'deceased'
                    ? 'bg-red-400'
                    : 'bg-amber-400'
                }`}
              />
              {character.status}
            </span>
          </div>

          {/* Hover Arrow Icon */}
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-dark-950/80 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-vital-500 transition-colors opacity-0 group-hover:opacity-100 duration-200">
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-display font-bold text-white group-hover:text-vital-400 transition-colors truncate">
            {character.full_name}
          </h3>

          {/* Affiliation / Tagline */}
          <div className="flex items-center gap-2 mt-1 min-h-[20px]">
            {character.gang ? (
              <span className="flex items-center gap-1 text-xs font-tech font-bold text-vital-400 truncate">
                <Shield size={12} className="shrink-0" />
                <span className="truncate">{character.gang}</span>
              </span>
            ) : character.occupation ? (
              <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
                <Briefcase size={12} className="shrink-0" />
                <span className="truncate">{character.occupation}</span>
              </span>
            ) : null}
          </div>

          {/* Summary */}
          {character.summary && (
            <p className="mt-2.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {character.summary}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500 font-tech">
        {character.aliases && character.aliases.length > 0 ? (
          <span className="truncate max-w-[150px]">
            {character.aliases[0]}
          </span>
        ) : (
          <span>Citizen</span>
        )}
        <span className="text-vital-400/80 group-hover:text-vital-400 transition-colors">
          View Profile &rarr;
        </span>
      </div>
    </a>
  );
};
