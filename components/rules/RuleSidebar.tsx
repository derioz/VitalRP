'use client';

import React from 'react';
import {
  ShieldAlert,
  Drama,
  Crosshair,
  Flame,
  BadgeCheck,
  HeartHandshake,
  Users,
  Swords,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { RULE_CATEGORIES, RuleCategory, Rule } from '@/data/rules';

const iconMap: Record<string, LucideIcon> = {
  ShieldAlert,
  Drama,
  Crosshair,
  Flame,
  BadgeCheck,
  HeartHandshake,
  Users,
  Swords,
  FileText,
};

interface RuleSidebarProps {
  categories: RuleCategory[];
  rules: Rule[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

/**
 * 21st.dev Documentation Sidebar component
 * Sticky desktop navigation rail with smooth category indicators, icons, and rule counts.
 */
export const RuleSidebar: React.FC<RuleSidebarProps> = ({
  categories,
  rules,
  activeCategoryId,
  onSelectCategory,
}) => {
  // Count rules per category
  const countMap = React.useMemo(() => {
    return rules.reduce<Record<string, number>>((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {});
  }, [rules]);

  return (
    <nav
      aria-label="Rule Categories"
      className="sticky top-28 flex flex-col gap-1 w-full select-none"
    >
      <div className="px-3 pb-3 mb-1 border-b border-white/5 flex items-center justify-between">
        <span className="text-[11px] font-tech uppercase tracking-[0.2em] text-gray-500 font-bold">
          Categories
        </span>
        <span className="text-[11px] font-tech text-vital-500 font-bold">
          {rules.length} RULES
        </span>
      </div>

      <div className="space-y-1">
        {categories.map((category) => {
          const Icon = iconMap[category.iconName] || FileText;
          const isActive = activeCategoryId === category.id;
          const count = countMap[category.id] || 0;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`group flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-vital-500/10 text-white border border-vital-500/40 shadow-[0_0_15px_rgba(249,115,22,0.15)] font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-vital-500' : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                />
                <span className="text-xs sm:text-sm tracking-tight truncate font-display">
                  {category.title}
                </span>
              </div>

              <span
                className={`text-[10px] font-tech px-2 py-0.5 rounded-full flex-shrink-0 ml-2 transition-colors ${
                  isActive
                    ? 'bg-vital-500 text-white font-bold'
                    : 'bg-white/5 text-gray-500 group-hover:text-gray-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
