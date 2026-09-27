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
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { RULES, RULE_CATEGORIES, Rule, RuleCategory } from '@/data/rules';
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
  // Live dynamic state initialized with default seed data for instantaneous render
  const [categories, setCategories] = useState<RuleCategory[]>(RULE_CATEGORIES);
  const [rules, setRules] = useState<Rule[]>(RULES);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(RULE_CATEGORIES[0].id);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const [highlightedRuleId, setHighlightedRuleId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Fetch live published rules from Supabase API
  useEffect(() => {
    let isMounted = true;
    async function loadLiveRules() {
      try {
        const res = await fetch('/api/rules');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.categories) && data.categories.length > 0 && Array.isArray(data.rules) && data.rules.length > 0) {
            const mappedCategories: RuleCategory[] = data.categories
              .filter((c: any) => c.enabled !== false)
              .map((c: any) => ({
                id: c.id,
                title: c.title,
                description: c.description || '',
                iconName: c.icon || 'ShieldAlert',
              }));

            const mappedRules: Rule[] = data.rules
              .filter((r: any) => r.enabled !== false && !r.deleted_at)
              .map((r: any) => ({
                id: r.id,
                category: r.category_id,
                title: r.title,
                shortTitle: r.short_title || r.title,
                summary: r.short_description || r.summary || '',
                content: r.content,
                aliases: r.aliases || [],
                featured: Boolean(r.featured),
                coreRuleNumber: r.core_rule_number || r.rule_number,
                callouts: r.callouts || [],
              }));

            if (isMounted) {
              setCategories(mappedCategories);
              setRules(mappedRules);
            }
          }
        }
      } catch (err) {
        // Fallback to static seed rules
      }
    }

    loadLiveRules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Core 10 rules sorted by coreRuleNumber
  const coreRules = React.useMemo(() => {
    return rules.filter((r) => r.featured).sort(
      (a, b) => (a.coreRuleNumber || 99) - (b.coreRuleNumber || 99)
    );
  }, [rules]);

  // Jump to specific rule by ID
  const navigateToRule = useCallback((ruleId: string) => {
    setOpenAccordionValues((prev) => (prev.includes(ruleId) ? prev : [...prev, ruleId]));

    const targetRule = rules.find((r) => r.id === ruleId);
    if (targetRule) {
      setActiveCategoryId(targetRule.category);
      setActiveRuleId(ruleId);
    }

    setHighlightedRuleId(ruleId);
    setTimeout(() => {
      setHighlightedRuleId(null);
    }, 3000);

    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${ruleId}`);
    }

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
  }, [rules]);

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
        const found = rules.find((r) => r.id === hash);
        if (found) {
          setTimeout(() => navigateToRule(hash), 150);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [rules, navigateToRule]);

  // IntersectionObserver to track visible category and active rule
  useEffect(() => {
    const categoryElements = categories.map((c) =>
      document.getElementById(`category-${c.id}`)
    ).filter(Boolean) as HTMLElement[];

    if (categoryElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
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
  }, [categories]);

  // Expand all / Collapse all in active category
  const handleExpandAll = (categoryId: string) => {
    const categoryRuleIds = rules.filter((r) => r.category === categoryId).map((r) => r.id);
    setOpenAccordionValues((prev) => Array.from(new Set([...prev, ...categoryRuleIds])));
  };

  const handleCollapseAll = (categoryId: string) => {
    const categoryRuleIds = new Set(
      rules.filter((r) => r.category === categoryId).map((r) => r.id)
    );
    setOpenAccordionValues((prev) => prev.filter((id) => !categoryRuleIds.has(id)));
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white">
      {/* Search Modal */}
      <RuleSearchCommand
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelectRule={navigateToRule}
      />

      {/* Mobile Drawer */}
      <RuleMobileDrawer
        isOpen={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
        categories={categories}
        rules={rules}
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
                The {coreRules.length} essential rules every citizen must understand before stepping into Los Santos.
              </p>
            </div>

            <span className="text-xs font-tech text-gray-500 self-start sm:self-auto">
              {coreRules.length} CORE PILLARS
            </span>
          </div>

          {/* Spotlight Cards Grid */}
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
          {/* LEFT: Sticky Category Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <RuleSidebar
              categories={categories}
              rules={rules}
              activeCategoryId={activeCategoryId}
              onSelectCategory={navigateToCategory}
            />
          </aside>

          {/* CENTER: Full Categorized Rules with Accordions */}
          <main className="lg:col-span-9 xl:col-span-6 space-y-16">
            {categories.map((category) => {
              const categoryRules = rules.filter((r) => r.category === category.id);
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

                  {/* Accordion for Category */}
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

          {/* RIGHT: Sticky Active Table of Contents */}
          <aside className="hidden xl:block xl:col-span-3">
            <RuleTableOfContents
              categories={categories}
              rules={rules}
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
