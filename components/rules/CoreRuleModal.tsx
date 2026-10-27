'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { Rule, RULE_CATEGORIES } from '@/data/rules';
import { RuleCallout } from './RuleCallout';
import { FormattedRuleText } from './FormattedRuleText';

interface CoreRuleModalProps {
  rule: Rule | null;
  ruleNumber?: number;
  onClose: () => void;
}

/**
 * Interactive Core Rule Detail Modal
 * Shows the full rule text, summary, and callouts.
 */
export const CoreRuleModal: React.FC<CoreRuleModalProps> = ({
  rule,
  ruleNumber,
  onClose,
}) => {
  // ESC key listener & body scroll lock
  useEffect(() => {
    if (!rule) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [rule, onClose]);

  if (!rule) return null;

  const category = RULE_CATEGORIES.find((c) => c.id === rule.category);
  const formattedNumber = ruleNumber
    ? ruleNumber < 10
      ? `0${ruleNumber}`
      : `${ruleNumber}`
    : undefined;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-dark-900/95 border border-white/15 rounded overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-950/70">
            <div className="flex items-center gap-2.5">
              {formattedNumber && (
                <span className="text-sm font-tech tabular-nums text-vital-400">
                  Rule {formattedNumber}
                </span>
              )}
              {category && (
                <span className="text-sm font-tech text-gray-300">
                  {category.title}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-left custom-scrollbar">
            {/* Title */}
            <h2 className="text-2xl font-display font-black text-white tracking-tight">
              {rule.title}
            </h2>

            <p className="text-base text-gray-100 leading-relaxed font-sans">
              {rule.summary}
            </p>

            {/* Official Callouts */}
            {rule.callouts && rule.callouts.length > 0 && (
              <div className="space-y-3">
                {rule.callouts.map((callout, idx) => (
                  <RuleCallout key={idx} callout={callout} />
                ))}
              </div>
            )}

            {/* Detailed Official Rule Text */}
            <div className="space-y-3 text-sm text-gray-200 leading-relaxed font-sans border-t border-white/10 pt-4">
              <FormattedRuleText content={rule.content} />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-dark-950/80">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded text-sm font-display font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Close
            </button>

            <a
              href={`/rules#${rule.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-vital-500 hover:bg-vital-400 text-dark-950 font-display font-bold text-sm transition-colors"
            >
              <span>View in full rules</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
