'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface CoreRuleRowProps {
  id: string;
  ruleNumber: number;
  shortTitle: string;
  /** Penalty headline from the published rule, when it has one. */
  tag?: string;
  onSelect: (id: string) => void;
}

/** One highlighted rule. Selecting it opens the summary and full text. */
export const CoreRuleRow: React.FC<CoreRuleRowProps> = ({
  id,
  ruleNumber,
  shortTitle,
  tag,
  onSelect,
}) => (
  <button
    type="button"
    aria-haspopup="dialog"
    onClick={() => onSelect(id)}
    className="group flex min-h-16 w-full items-center gap-4 py-3 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-vital-400"
  >
    <span className="w-7 shrink-0 font-tech text-sm tabular-nums text-vital-500">
      {ruleNumber < 10 ? `0${ruleNumber}` : ruleNumber}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-lg font-display font-bold tracking-tight text-white">{shortTitle}</span>
      {tag && <span className="mt-0.5 block text-sm font-tech text-vital-400">{tag}</span>}
    </span>
    <ArrowUpRight
      className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-vital-400"
      aria-hidden="true"
    />
  </button>
);
