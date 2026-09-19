'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { List, ChevronRight } from 'lucide-react';
import { Rule, RuleCategory } from '@/data/rules';

interface RuleTableOfContentsProps {
  categories: RuleCategory[];
  rules: Rule[];
  activeCategoryId: string;
  activeRuleId: string | null;
  onNavigate: (ruleId: string) => void;
}

/**
 * 21st.dev Active Table of Contents component
 * Uses IntersectionObserver for scroll spy, highlights current rule,
 * and maintains reading progress without lag.
 */
export const RuleTableOfContents: React.FC<RuleTableOfContentsProps> = ({
  categories,
  rules,
  activeCategoryId,
  activeRuleId,
  onNavigate,
}) => {
  // Current category's rules for deep nested navigation
  const currentCategoryRules = useMemo(() => {
    return rules.filter((r) => r.category === activeCategoryId);
  }, [rules, activeCategoryId]);

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId);
  }, [categories, activeCategoryId]);

  return (
    <nav
      aria-label="On This Page"
      className="sticky top-28 flex flex-col gap-3 w-full select-none"
    >
      <div className="flex items-center gap-2 text-xs font-tech uppercase tracking-[0.2em] text-gray-500 font-bold pb-2 border-b border-white/5">
        <List className="w-3.5 h-3.5 text-vital-500" />
        <span>On This Page</span>
      </div>

      {currentCategory && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-tech font-bold text-vital-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-vital-500" />
            {currentCategory.title}
          </span>

          <div className="relative pl-3 border-l border-white/10 flex flex-col gap-1.5 my-1">
            {currentCategoryRules.map((rule) => {
              const isActive = activeRuleId === rule.id;

              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => onNavigate(rule.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`text-left text-xs font-sans tracking-tight transition-all duration-150 relative py-1 pr-2 truncate block cursor-pointer group ${
                    isActive
                      ? 'text-vital-400 font-semibold pl-2 -ml-[13px] border-l-2 border-vital-500'
                      : 'text-gray-400 hover:text-white hover:translate-x-0.5'
                  }`}
                  title={rule.title}
                >
                  <span className="truncate block">{rule.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Jump to Core Rules */}
      <div className="pt-3 border-t border-white/5">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('core-rules');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-xs font-tech text-gray-500 hover:text-vital-400 transition-colors flex items-center justify-between w-full uppercase tracking-wider"
        >
          <span>↑ Core Rules Overview</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
};
