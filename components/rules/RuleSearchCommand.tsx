'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, Hash, ArrowRight, CornerDownLeft, Sparkles, BookOpen } from 'lucide-react';
import { RULES, RULE_CATEGORIES, Rule } from '@/data/rules';

interface RuleSearchCommandProps {
  onSelectRule: (ruleId: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 21st.dev Command Palette / Search Modal component (pattern by Rafael Porto / cmdk)
 * Provides instant fuzzy search, alias resolution, category tags, and jump-to-rule execution.
 */
export const RuleSearchCommand: React.FC<RuleSearchCommandProps> = ({
  onSelectRule,
  isOpen,
  onOpenChange,
}) => {
  const [search, setSearch] = useState('');

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onOpenChange]);

  // Map category IDs to titles
  const categoryMap = useMemo(() => {
    return RULE_CATEGORIES.reduce<Record<string, string>>((acc, cat) => {
      acc[cat.id] = cat.title;
      return acc;
    }, {});
  }, []);

  // Filter rules based on search input
  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return RULES.slice(0, 10); // Show first 10 when empty

    return RULES.filter((rule) => {
      const titleMatch = rule.title.toLowerCase().includes(query);
      const shortTitleMatch = rule.shortTitle?.toLowerCase().includes(query);
      const summaryMatch = rule.summary.toLowerCase().includes(query);
      const contentMatch = rule.content.toLowerCase().includes(query);
      const categoryMatch = (categoryMap[rule.category] || '').toLowerCase().includes(query);
      const aliasMatch = rule.aliases.some((alias) => alias.toLowerCase().includes(query));

      return titleMatch || shortTitleMatch || summaryMatch || contentMatch || categoryMatch || aliasMatch;
    });
  }, [search, categoryMap]);

  const handleSelect = (ruleId: string) => {
    onOpenChange(false);
    setSearch('');
    onSelectRule(ruleId);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/4 z-50 w-[92vw] max-w-2xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[75vh]">
          <Dialog.Title className="sr-only">Search Vital RP Rules</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search rule titles, summaries, official text, categories, and abbreviations.
          </Dialog.Description>

          <Command className="w-full flex flex-col overflow-hidden" shouldFilter={false}>
            {/* Input Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-dark-950/40">
              <Search className="w-5 h-5 text-vital-500 flex-shrink-0" />
              <Command.Input
                autoFocus
                placeholder="Search rules, aliases (RDM, FearRP, NLR, MG, POV, heists)..."
                value={search}
                onValueChange={setSearch}
                className="flex-1 bg-transparent border-none text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 rounded text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-tech text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                ESC
              </kbd>
            </div>

            {/* Suggestions / Shortcuts row when empty */}
            {!search && (
              <div className="px-5 py-2.5 bg-dark-950/60 border-b border-white/5 flex flex-wrap items-center gap-2 text-xs font-tech text-gray-400">
                <span className="text-gray-500 uppercase tracking-widest text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-vital-500" /> Popular:
                </span>
                {['FearRP', 'NLR', 'Metagaming', 'RDM / VDM', 'Heists', 'Combat Logging', 'Factions'].map(
                  (term) => (
                    <button
                      key={term}
                      onClick={() => setSearch(term)}
                      className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-vital-500/10 hover:text-vital-400 border border-white/5 text-[11px] transition-colors cursor-pointer"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Results List */}
            <Command.List className="overflow-y-auto max-h-[50vh] p-2 space-y-1">
              {filteredRules.length === 0 ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                  <BookOpen className="w-8 h-8 opacity-40 text-vital-500" />
                  <p className="text-sm">No rules matching &ldquo;{search}&rdquo;</p>
                  <span className="text-xs text-gray-600 font-tech">Try searching by abbreviations: RDM, PG, MG, NLR, POV</span>
                </div>
              ) : (
                filteredRules.map((rule) => {
                  const categoryName = categoryMap[rule.category] || rule.category;
                  return (
                    <Command.Item
                      key={rule.id}
                      value={rule.id}
                      onSelect={() => handleSelect(rule.id)}
                      className="group flex flex-col gap-1 p-3.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-vital-500/10 aria-selected:bg-vital-500/10 aria-selected:border-vital-500/30 border border-transparent"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-500 group-hover:text-vital-500 transition-colors" />
                          <span className="font-display font-bold text-white group-hover:text-vital-400 transition-colors text-sm sm:text-base">
                            {rule.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-tech uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-gray-400 group-hover:text-white transition-colors">
                          {categoryName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 pl-6 group-hover:text-gray-300">
                        {rule.summary}
                      </p>
                    </Command.Item>
                  );
                })
              )}
            </Command.List>

            {/* Command Footer */}
            <div className="px-5 py-3 border-t border-white/10 bg-dark-950/70 flex items-center justify-between text-[11px] font-tech text-gray-500">
              <span>{filteredRules.length} matching rules</span>
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <CornerDownLeft className="w-3.5 h-3.5 text-vital-500" /> Navigate to rule
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
