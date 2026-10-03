import React from 'react';
import { WikiRelationship } from '../../lib/wiki/types';
import { Heart, Shield, Users, Skull, UserCheck } from 'lucide-react';

interface CharacterRelationshipsProps {
  relationships: WikiRelationship[];
  canEdit?: boolean;
  onAddRelationship?: () => void;
}

export const CharacterRelationships: React.FC<CharacterRelationshipsProps> = ({
  relationships,
}) => {
  if (!relationships || relationships.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 bg-white/[0.02] border border-white/5 rounded-2xl">
        No publicly recorded relationships for this character yet.
      </div>
    );
  }

  const getRelationshipIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('partner') || lower.includes('spouse')) return <Heart size={14} className="text-pink-400" />;
    if (lower.includes('enemy') || lower.includes('rival')) return <Skull size={14} className="text-red-400" />;
    if (lower.includes('gang') || lower.includes('syndicate')) return <Shield size={14} className="text-vital-400" />;
    if (lower.includes('family')) return <UserCheck size={14} className="text-blue-400" />;
    return <Users size={14} className="text-emerald-400" />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {relationships.map((rel, idx) => {
        const target = rel.target;
        const targetSlug = target?.slug || '#';
        const targetName = target?.full_name || 'Unknown Character';

        return (
          <div
            key={rel.id || `rel-${idx}`}
            className="group relative bg-dark-900/60 hover:bg-dark-900/90 border border-white/5 hover:border-vital-500/30 rounded-2xl p-4 transition-all duration-200 flex items-start gap-3.5 shadow-md"
          >
            {/* Target Avatar */}
            <a href={`/wiki/characters/${targetSlug}`} className="shrink-0">
              <img
                src={
                  target?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    targetName
                  )}&background=f97316&color=fff`
                }
                alt={targetName}
                className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:border-vital-500/50 transition-colors"
              />
            </a>

            {/* Relationship Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <a
                  href={`/wiki/characters/${targetSlug}`}
                  className="text-sm font-display font-bold text-white hover:text-vital-400 transition-colors truncate"
                >
                  {targetName}
                </a>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-gray-300 shrink-0">
                  {getRelationshipIcon(rel.relationship_type)}
                  <span>{rel.relationship_type}</span>
                </span>
              </div>

              {target?.gang && (
                <div className="text-[11px] font-tech text-vital-400 truncate mt-0.5">
                  {target.gang}
                </div>
              )}

              {rel.description && (
                <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {rel.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
