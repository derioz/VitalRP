'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Drama,
  Heart,
  RefreshCw,
  Eye,
  Zap,
  Crosshair,
  Ban,
  LogOut,
  AlertOctagon,
  Menu,
  Search,
  ChevronDown,
  ArrowUp,
  LucideIcon,
  Sparkles,
} from 'lucide-react';
import { RULES, RULE_CATEGORIES, Rule } from '@/data/rules';
import { RulesHero } from './RulesHero';
import { SpotlightCard } from './SpotlightCard';
import { RuleAccordion } from './RuleAccordion';
import { RuleSidebar } from './RuleSidebar';
import { RuleTableOfContents } from './RuleTableOfContents';
import { RuleSearchCommand } from './RuleSearchCommand';
import { RuleMobileDrawer } from './RuleMobileDrawer';

// Map core rule IDs to specific icons
const coreRuleIcons: Record<string, LucideIcon> = {
  'server-age-restriction': ShieldAlert,
  'stay-in-character': Drama,
  'fear-rp': Heart,
  'new-life-rule': RefreshCw,
  'metagaming': Eye,
  'powergaming': Zap,
  'rdm-vdm': Crosshair,
  'exploits-cheating': Ban,
  'combat-logging': LogOut,
  'zero-tolerance-conduct': AlertOctagon,
};

export const RulesView: React.FC = () => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(RULE_CATEGORIES[0].id);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const [highlightedRuleId, setHighlightedRuleId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Core 10 rules sorted by coreRuleNumber
  const coreRules = React.useMemo(() => {
    return RULES.filter((r) => r.featured).sort(
      (a, b) => (a.coreRuleNumber || 99) - (b.coreRuleNumber || 99)
    );
  }, []);

  // Jump to specific rule by ID
  const navigateToRule = useCallback((ruleId: string) => {
    // Open its accordion if not already open
    setOpenAccordionValues((prev) => (prev.includes(ruleId) ? prev : [...prev, ruleId]));

    // Find rule's category and update active category
    const targetRule = RULES.find((r) => r.id === ruleId);
    if (targetRule) {
      setActiveCategoryId(targetRule.category);
      setActiveRuleId(ruleId);
    }

    // Flash highlight
    setHighlightedRuleId(ruleId);
    setTimeout(() => {
      setHighlightedRuleId(null);
    }, 3000);

    // Update URL hash without forcing full page reload
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${ruleId}`);
    }

    // Smooth scroll with offset for floating navbar
    requestAnimationFrame(() => {
      const el = document.getElementById(ruleId);
      if (el) {
        const navHeight = 90;
        const rect = el.getBoundingClientRect();
        const absoluteTop = rect.top + window.pageYOffset - navHeight;
        window.scrollTo({
          top: absoluteTop,
          behavior: 'smooth',
        });
      }
    });
  }, []);

  // Handle category jump from sidebar or drawer
  const navigateToCategory = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    const categoryEl = document.getElementById(`category-${categoryId}`);
    if (categoryEl) {
      const navHeight = 90;
      const rect = categoryEl.getBoundingClientRect();
      const absoluteTop = rect.top + window.pageYOffset - navHeight;
      window.scrollTo({
        top: absoluteTop,
        behavior: 'smooth',
      });
    }
  }, []);

  // Handle URL hash on initial load and hashchange
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const found = RULES.find((r) => r.id === hash);
        if (found) {
          setTimeout(() => navigateToRule(hash), 150);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [navigateToRule]);

  // IntersectionObserver to track visible category and active rule
  useEffect(() => {
    const categoryElements = RULE_CATEGORIES.map((c) =>
      document.getElementById(`category-${c.id}`)
    ).filter(Boolean) as HTMLElement[];

    if (categoryElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible category
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const catId = entry.target.id.replace('category-', '');
            setActiveCategoryId(catId);
            break;
          }
        }
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0.1,
      }
    );

    categoryElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Expand all / Collapse all in active category
  const handleExpandAll = (categoryId: string) => {
    const categoryRuleIds = RULES.filter((r) => r.category === categoryId).map((r) => r.id);
    setOpenAccordionValues((prev) => Array.from(new Set([...prev, ...categoryRuleIds])));
  };

  const handleCollapseAll = (categoryId: string) => {
    const categoryRuleIds = new Set(
      RULES.filter((r) => r.category === categoryId).map((r) => r.id)
    );
    setOpenAccordionValues((prev) => prev.filter((id) => !categoryRuleIds.has(id)));
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white">
      {/* 21st.dev Command Palette / Search Modal */}
      <RuleSearchCommand
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelectRule={navigateToRule}
      />

      {/* 21st.dev Mobile Drawer Sheet */}
      <RuleMobileDrawer
        isOpen={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
        categories={RULE_CATEGORIES}
        rules={RULES}
        activeCategoryId={activeCategoryId}
        onSelectCategory={navigateToCategory}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Compact Header / Hero */}
      <RulesHero onOpenSearch={() => setIsSearchOpen(true)} />

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 1: "KNOW THESE FIRST" (CORE RULES SPOTLIGHT CARDS)       */}
      {/* ----------------------------------------------------------------- */}
      <section id="core-rules" className="py-14 sm:py-20 border-b border-white/10 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-tech font-bold uppercase tracking-widest text-vital-500 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                FOUNDATIONAL KNOWLEDGE
              </div>
              <h2 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
                KNOW THESE FIRST
              </h2>
              <p className="text-xs sm:text-sm font-sans text-gray-400 mt-1 max-w-xl">
                The 10 essential rules every citizen must understand before stepping into Los Santos.
              </p>
            </div>

            <span className="text-xs font-tech text-gray-500 self-start sm:self-auto">
              10 CORE PILLARS
            </span>
          </div>

          {/* 21st.dev Spotlight Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {coreRules.map((rule) => {
              const Icon = coreRuleIcons[rule.id] || ShieldAlert;
              return (
                <SpotlightCard
                  key={rule.id}
                  id={rule.id}
                  ruleNumber={rule.coreRuleNumber}
                  title={rule.shortTitle || rule.title}
                  summary={rule.summary}
                  icon={Icon}
                  onReadFullRule={navigateToRule}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 2: FULL DOCUMENTATION BROWSER (3-COLUMN DESKTOP LAYOUT)   */}
      {/* ----------------------------------------------------------------- */}
      <div id="legislation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Mobile Quick Action Bar */}
        <div className="lg:hidden mb-8 sticky top-20 z-30 p-2 rounded-2xl bg-dark-900/90 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-vital-500/20"
          >
            <Menu className="w-4 h-4" />
            <span>Browse Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10"
            title="Search Rules"
          >
            <Search className="w-4 h-4 text-vital-500" />
          </button>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT: Sticky Category Sidebar (Hidden on mobile/tablet) */}
          <aside className="hidden lg:block lg:col-span-3">
            <RuleSidebar
              categories={RULE_CATEGORIES}
              rules={RULES}
              activeCategoryId={activeCategoryId}
              onSelectCategory={navigateToCategory}
            />
          </aside>

          {/* CENTER: Full Categorized Rules with Accordions */}
          <main className="lg:col-span-9 xl:col-span-6 space-y-16">
            {RULE_CATEGORIES.map((category) => {
              const categoryRules = RULES.filter((r) => r.category === category.id);
              if (categoryRules.length === 0) return null;

              return (
                <section
                  key={category.id}
                  id={`category-${category.id}`}
                  className="scroll-mt-28 space-y-4"
                >
                  {/* Category Header */}
                  <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-tech font-bold uppercase tracking-[0.25em] text-vital-500 block mb-1">
                        SECTION LEGISLATION
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
                        {category.title}
                      </h2>
                      <p className="text-xs sm:text-sm font-sans text-gray-400 mt-1 max-w-xl">
                        {category.description}
                      </p>
                    </div>

                    {/* Expand / Collapse Controls */}
                    <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-tech text-gray-500">
                      <button
                        type="button"
                        onClick={() => handleExpandAll(category.id)}
                        className="hover:text-vital-400 transition-colors cursor-pointer"
                      >
                        Expand All
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleCollapseAll(category.id)}
                        className="hover:text-vital-400 transition-colors cursor-pointer"
                      >
                        Collapse
                      </button>
                    </div>
                  </div>

                  {/* 21st.dev Radix UI Accordion for Category */}
                  <RuleAccordion
                    rules={categoryRules}
                    openValues={openAccordionValues}
                    onOpenChange={setOpenAccordionValues}
                    highlightedRuleId={highlightedRuleId}
                  />
                </section>
              );
            })}
          </main>

          {/* RIGHT: Sticky Active Table of Contents (Hidden below XL) */}
          <aside className="hidden xl:block xl:col-span-3">
            <RuleTableOfContents
              categories={RULE_CATEGORIES}
              rules={RULES}
              activeCategoryId={activeCategoryId}
              activeRuleId={activeRuleId}
              onNavigate={navigateToRule}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};
