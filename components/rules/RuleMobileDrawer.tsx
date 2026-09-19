'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Search,
  BookOpen,
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
  ChevronRight,
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

interface RuleMobileDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: RuleCategory[];
  rules: Rule[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onOpenSearch: () => void;
}

/**
 * 21st.dev Mobile Drawer / Sheet component
 * Touch-friendly bottom/side navigation drawer for mobile devices.
 */
export const RuleMobileDrawer: React.FC<RuleMobileDrawerProps> = ({
  isOpen,
  onOpenChange,
  categories,
  rules,
  activeCategoryId,
  onSelectCategory,
  onOpenSearch,
}) => {
  const countMap = React.useMemo(() => {
    return rules.reduce<Record<string, number>>((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {});
  }, [rules]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-dark-900 border-t border-white/15 rounded-t-3xl shadow-2xl p-6 overflow-y-auto flex flex-col text-white">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-4" />

          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div>
              <Dialog.Title className="text-lg font-display font-bold text-white">
                Server Rules Navigation
              </Dialog.Title>
              <Dialog.Description className="text-xs font-tech text-gray-400 mt-0.5">
                Select a category to jump directly to its legislation.
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Search Trigger Button inside Drawer */}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onOpenSearch();
            }}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-vital-500/40 text-gray-400 hover:text-white transition-colors mb-4 text-sm font-sans cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-vital-500" />
              <span>Search rules or abbreviations...</span>
            </div>
            <span className="text-[10px] font-tech text-vital-500 font-bold uppercase tracking-wider">
              SEARCH
            </span>
          </button>

          {/* Category List */}
          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {categories.map((category) => {
              const Icon = iconMap[category.iconName] || FileText;
              const isActive = activeCategoryId === category.id;
              const count = countMap[category.id] || 0;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onSelectCategory(category.id);
                  }}
                  className={`flex items-center justify-between w-full p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-vital-500/15 border border-vital-500/50 text-white font-semibold shadow-md'
                      : 'bg-white/[0.02] hover:bg-white/5 border border-transparent text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? 'bg-vital-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                          : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-display font-bold truncate">
                        {category.title}
                      </span>
                      <span className="text-xs font-sans text-gray-400 truncate">
                        {category.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs font-tech font-bold text-vital-500 px-2 py-0.5 rounded-full bg-white/5">
                      {count}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
