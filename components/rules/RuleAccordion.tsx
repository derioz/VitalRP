'use client';

import React, { useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { Rule } from '@/data/rules';
import { RuleCallout } from './RuleCallout';

interface RuleAccordionProps {
  rules: Rule[];
  openValues: string[];
  onOpenChange: (values: string[]) => void;
  highlightedRuleId: string | null;
}

/**
 * 21st.dev Radix UI Animated Accordion component
 * Supports multi-expansion, smooth animations, accessible keyboard control,
 * permanent shareable anchors, and target flash highlight.
 */
export const RuleAccordion: React.FC<RuleAccordionProps> = ({
  rules,
  openValues,
  onOpenChange,
  highlightedRuleId,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/rules#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AccordionPrimitive.Root
      type="multiple"
      value={openValues}
      onValueChange={onOpenChange}
      className="space-y-3"
    >
      {rules.map((rule) => {
        const isHighlighted = highlightedRuleId === rule.id;
        const isOpen = openValues.includes(rule.id);

        return (
          <AccordionPrimitive.Item
            key={rule.id}
            id={rule.id}
            value={rule.id}
            className={`rounded-xl border transition-all duration-300 overflow-hidden ${
              isHighlighted
                ? 'border-vital-500 shadow-[0_0_25px_rgba(249,115,22,0.35)] ring-1 ring-vital-500 bg-dark-900/90'
                : isOpen
                ? 'border-white/15 bg-dark-900/70 shadow-lg'
                : 'border-white/5 bg-dark-900/40 hover:border-white/15 hover:bg-dark-900/60'
            }`}
          >
            {/* Rule Header / Trigger */}
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                className="flex flex-1 items-start sm:items-center justify-between p-5 text-left transition-colors group cursor-pointer select-none"
              >
                <div className="flex flex-col gap-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-display font-bold text-white group-hover:text-vital-400 transition-colors tracking-tight">
                      {rule.title}
                    </span>
                    {rule.featured && (
                      <span className="text-[10px] font-tech font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-vital-500/10 text-vital-400 border border-vital-500/20">
                        CORE RULE
                      </span>
                    )}
                  </div>
                  {/* Always-visible short summary for fast scanning */}
                  <p className="text-xs sm:text-sm font-sans text-gray-400 font-normal leading-relaxed line-clamp-2">
                    {rule.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 mt-1 sm:mt-0">
                  {/* Share Anchor Button */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(e, rule.id)}
                    title="Copy permanent link to rule"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-vital-400 hover:bg-white/5 transition-colors"
                  >
                    {copiedId === rule.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                  </button>

                  {/* Animated Chevron */}
                  <div className="p-1 rounded-lg bg-white/5 group-hover:bg-vital-500/20 group-hover:text-vital-400 transition-all text-gray-400">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ease-out ${
                        isOpen ? 'rotate-180 text-vital-500' : ''
                      }`}
                    />
                  </div>
                </div>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>

            {/* Accordion Content with smooth Radix transition */}
            <AccordionPrimitive.Content
              className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden px-5 pb-6 text-sm"
            >
              <div className="pt-2 border-t border-white/5 flex flex-col gap-4">
                {/* Official Rule Header */}
                <div className="flex items-center justify-between text-xs font-tech uppercase tracking-widest text-vital-500 font-semibold pt-2">
                  <span>Official Legislation</span>
                  <a
                    href={`#${rule.id}`}
                    className="text-gray-500 hover:text-vital-400 text-[11px] lowercase tracking-normal flex items-center gap-1"
                  >
                    <span>/rules#{rule.id}</span>
                  </a>
                </div>

                {/* Complete Unaltered Official Text */}
                <div className="font-sans text-gray-300 leading-relaxed space-y-3 whitespace-pre-line text-sm">
                  {rule.content}
                </div>

                {/* Structured Callout Boxes */}
                {rule.callouts && rule.callouts.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {rule.callouts.map((callout, idx) => (
                      <RuleCallout key={idx} callout={callout} />
                    ))}
                  </div>
                )}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        );
      })}
    </AccordionPrimitive.Root>
  );
};
