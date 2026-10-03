import React from 'react';
import { WikiCharacter, CharacterStatus } from '../../lib/wiki/types';
import { Calendar, User, Briefcase, Shield, Building, Home, Heart, Award, Eye, Clock } from 'lucide-react';

interface CharacterInfoboxProps {
  character: WikiCharacter;
  status: CharacterStatus;
  pageViews?: number;
  updatedAt?: string;
  className?: string;
}

export const CharacterInfobox: React.FC<CharacterInfoboxProps> = ({
  character,
  status,
  pageViews,
  updatedAt,
  className = '',
}) => {
  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    deceased: 'bg-red-500/10 text-red-400 border-red-500/30',
    archived: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };

  return (
    <aside
      aria-label="Character Information"
      className={`bg-dark-900/90 border border-white/10 rounded-3xl p-5 lg:p-6 backdrop-blur-xl shadow-2xl shadow-black/60 flex flex-col gap-5 ${className}`}
    >
      {/* Character Header / Name */}
      <div className="text-center pb-3 border-b border-white/5">
        <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-wide">
          {character.full_name}
        </h2>
        {character.aliases && character.aliases.length > 0 && (
          <p className="text-xs text-vital-400 font-tech mt-1 tracking-wider">
            a.k.a. {character.aliases.join(', ')}
          </p>
        )}
      </div>

      {/* Main Character Portrait */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-dark-800 border border-white/10 shadow-inner group">
        <img
          src={
            character.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              character.full_name
            )}&background=f97316&color=fff&size=512`
          }
          alt={character.full_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-tech font-bold uppercase tracking-wider border shadow-lg backdrop-blur-md ${
              statusColors[status] || statusColors.active
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                status === 'active'
                  ? 'bg-emerald-400'
                  : status === 'deceased'
                  ? 'bg-red-400'
                  : 'bg-amber-400'
              }`}
            />
            {status}
          </span>
        </div>
      </div>

      {/* Structured Profile Fields */}
      <div className="space-y-2 text-xs divide-y divide-white/5">
        {character.date_of_birth && (
          <div className="flex items-center justify-between py-1.5 pt-2">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="text-vital-400" />
              <span>Date of Birth</span>
            </span>
            <span className="text-white font-medium text-right">{character.date_of_birth}</span>
          </div>
        )}

        {(character.pronouns || character.gender) && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <User size={13} className="text-vital-400" />
              <span>Pronouns / Gender</span>
            </span>
            <span className="text-white font-medium text-right">
              {[character.pronouns, character.gender].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}

        {character.nationality && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 font-medium">Nationality</span>
            <span className="text-white font-medium text-right">{character.nationality}</span>
          </div>
        )}

        {character.occupation && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Briefcase size={13} className="text-vital-400" />
              <span>Occupation</span>
            </span>
            <span className="text-white font-medium text-right">{character.occupation}</span>
          </div>
        )}

        {character.employer && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 font-medium">Employer</span>
            <span className="text-white font-medium text-right">{character.employer}</span>
          </div>
        )}

        {character.gang && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Shield size={13} className="text-vital-400" />
              <span>Faction / Gang</span>
            </span>
            <span className="text-vital-400 font-bold font-tech text-right">{character.gang}</span>
          </div>
        )}

        {character.business && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Building size={13} className="text-vital-400" />
              <span>Businesses</span>
            </span>
            <span className="text-white font-medium text-right">{character.business}</span>
          </div>
        )}

        {character.residence && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Home size={13} className="text-vital-400" />
              <span>Residence</span>
            </span>
            <span className="text-white font-medium text-right">{character.residence}</span>
          </div>
        )}

        {character.relationship_status && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Heart size={13} className="text-vital-400" />
              <span>Relationship</span>
            </span>
            <span className="text-white font-medium text-right">{character.relationship_status}</span>
          </div>
        )}

        {character.player_name && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Award size={13} className="text-vital-400" />
              <span>Played By</span>
            </span>
            <span className="text-vital-300 font-tech font-bold text-right">
              {character.player_name}
            </span>
          </div>
        )}
      </div>

      {/* Metadata Footer */}
      {(pageViews !== undefined || updatedAt) && (
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-tech uppercase tracking-wider">
          {pageViews !== undefined && (
            <span className="flex items-center gap-1">
              <Eye size={12} />
              <span>{pageViews.toLocaleString()} views</span>
            </span>
          )}
          {updatedAt && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              <span>{new Date(updatedAt).toLocaleDateString()}</span>
            </span>
          )}
        </div>
      )}
    </aside>
  );
};
