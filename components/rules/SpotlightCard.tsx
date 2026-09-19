'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface SpotlightCardProps {
  id: string;
  ruleNumber?: number;
  title: string;
  summary: string;
  icon: LucideIcon;
  onReadFullRule: (ruleId: string) => void;
  className?: string;
}

/**
 * 21st.dev Spotlight Card component (pattern by Hossain Jahed)
 * Adapted for Vital RP design system with pointer-tracked radial glow and orange accent.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  id,
  ruleNumber,
  title,
  summary,
  icon: Icon,
  onReadFullRule,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setOpacity(1);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOpacity(0);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group rounded-2xl border border-white/10 bg-dark-900/60 p-6 overflow-hidden transition-all duration-300 hover:border-vital-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.12)] flex flex-col justify-between ${className}`}
    >
      {/* 21st.dev Spotlight Radial Glow Overlay */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(249, 115, 22, 0.12), transparent 40%)`,
        }}
      />

      {/* Spotlight Border Glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
        style={{
          opacity,
          background: `radial-gradient(350px circle at ${position.x}px ${position.y}px, rgba(249, 115, 22, 0.35), transparent 40%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header: Icon & Core Rule Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-vital-500/10 border border-vital-500/20 flex items-center justify-center text-vital-500 group-hover:bg-vital-500/20 group-hover:scale-105 transition-all duration-200">
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
          {ruleNumber && (
            <span className="text-[11px] font-tech font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 group-hover:text-vital-400 group-hover:border-vital-500/30 transition-colors">
              RULE #{ruleNumber}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-display font-bold text-white mb-2 group-hover:text-vital-400 transition-colors tracking-tight">
          {title}
        </h3>

        {/* Summary */}
        <p className="text-sm font-sans text-gray-400 leading-relaxed flex-1 mb-5">
          {summary}
        </p>

        {/* Read Full Rule Action */}
        <button
          onClick={() => onReadFullRule(id)}
          className="inline-flex items-center gap-2 text-xs font-tech font-semibold text-vital-500 hover:text-vital-400 transition-all uppercase tracking-wider group/btn self-start cursor-pointer select-none"
        >
          <span>Read Full Rule</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
