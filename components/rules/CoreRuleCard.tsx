'use client';

import React from 'react';
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

export const CoreRuleCard: React.FC<CoreRuleCardProps> = ({
  id,
  ruleNumber,
  shortTitle,
  tag,
  summary,
  onSelect,
}) => {
  const formattedNumber = ruleNumber < 10 ? `0${ruleNumber}` : `${ruleNumber}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="group h-full w-full rounded border border-white/10 bg-dark-900/60 p-5 flex flex-col text-left cursor-pointer transition-colors duration-150 hover:border-vital-500/60 hover:bg-dark-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vital-400"
    >
      <span className="font-tech tabular-nums text-sm text-vital-500 mb-3">{formattedNumber}</span>
      <h3 className="text-lg font-display font-black text-white mb-1 tracking-tight">{shortTitle}</h3>
      <p className="text-sm font-tech text-gray-300 mb-3">{tag}</p>
      <p className="text-sm font-sans text-gray-300 leading-relaxed mb-4 flex-1">{summary}</p>
      <span className="pt-3 border-t border-white/10 flex items-center justify-between text-sm font-display font-bold text-gray-200 group-hover:text-vital-400 transition-colors">
        Read rule
        <ArrowUpRight className="w-4 h-4 text-vital-500" />
      </span>
    </button>
  );
};
