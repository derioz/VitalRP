'use client';

import React, { useRef, useState, useCallback } from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

export interface CoreRuleCardProps {
  id: string;
  ruleNumber: number;
  title: string;
  shortTitle: string;
  tag: string;
  summary: string;
  icon: LucideIcon;
  onSelect: (id: string) => void;
}

/**
 * 21st.dev Spotlight Core Rule Card
 * Features pointer-tracked radial glow and subtle dual-layer borders.
 */
export const CoreRuleCard: React.FC<CoreRuleCardProps> = ({
  id,
  ruleNumber,
  title,
  shortTitle,
  tag,
  summary,
  icon: Icon,
  onSelect,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const formattedNumber = ruleNumber < 10 ? `0${ruleNumber}` : `${ruleNumber}`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      className="relative group rounded-2xl border border-white/[0.08] bg-dark-900/60 p-5 overflow-hidden transition-all duration-300 hover:border-vital-500/40 hover:bg-dark-900/80 hover:shadow-[0_0_25px_rgba(249,115,22,0.12)] flex flex-col justify-between cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-vital-500/40"
    >
      {/* 21st.dev Pointer-Tracked Spotlight Glow Overlay */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(249, 115, 22, 0.12), transparent 60%)`,
        }}
      />

      {/* Spotlight Border Mask */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(240px circle at ${mousePos.x}px ${mousePos.y}px, rgba(249, 115, 22, 0.35), transparent 50%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top Row: Icon & Rule Number */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-10 h-10 rounded-xl bg-vital-500/10 border border-vital-500/20 flex items-center justify-center text-vital-500 group-hover:bg-vital-500/20 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.2)] transition-all duration-300 flex-shrink-0">
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>

          <span className="text-[10px] font-tech font-bold uppercase tracking-wider text-vital-400/90 bg-vital-500/10 px-2 py-0.5 rounded border border-vital-500/20 group-hover:text-vital-300 group-hover:border-vital-500/40 transition-colors">
            RULE // {formattedNumber}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-display font-black text-white mb-1 group-hover:text-vital-300 transition-colors tracking-tight line-clamp-1">
          {shortTitle}
        </h3>

        {/* Badge Pill */}
        <div className="mb-2.5">
          <span className="inline-block text-[10px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-gray-300 group-hover:border-vital-500/30 group-hover:text-vital-400 transition-colors">
            {tag}
          </span>
        </div>

        {/* Summary Description */}
        <p className="text-xs font-sans text-gray-400 leading-relaxed line-clamp-3 mb-4 flex-1">
          {summary}
        </p>

        {/* Action Link Footer */}
        <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-tech font-bold uppercase tracking-wider text-gray-400 group-hover:text-vital-400 transition-colors">
          <span>Read Directive</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-vital-500" />
        </div>
      </div>
    </div>
  );
};
