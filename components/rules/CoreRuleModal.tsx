'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { Rule, RULE_CATEGORIES } from '@/data/rules';
import { RuleCallout } from './RuleCallout';

interface CoreRuleModalProps {
  rule: Rule | null;
  ruleNumber?: number;
  onClose: () => void;
}

/**
 * Interactive Core Rule Detail Modal
 * Shows full official rule text, summary, and callouts with glassmorphism styling.
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
          className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-dark-900/95 border border-vital-500/30 rounded-2xl shadow-[0_0_60px_rgba(249,115,22,0.18)] overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-950/70 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              {formattedNumber && (
                <span className="text-[11px] font-tech font-bold uppercase tracking-wider text-vital-400 bg-vital-500/10 px-2.5 py-1 rounded border border-vital-500/20">
                  RULE // {formattedNumber}
                </span>
              )}
              {category && (
                <span className="text-xs font-tech font-semibold text-gray-400 uppercase tracking-wider">
                  {category.title}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-left custom-scrollbar">
            {/* Title */}
            <h2 className="text-2xl font-display font-black text-white tracking-tight uppercase">
              {rule.title}
            </h2>

            {/* Directive Summary */}
            <div className="p-4 rounded-xl bg-vital-500/5 border-l-4 border-vital-500 text-sm text-gray-200 leading-relaxed font-sans">
              <span className="text-[11px] font-tech font-bold uppercase tracking-wider text-vital-400 block mb-1">
                Directive Summary
              </span>
              {rule.summary}
            </div>

            {/* Official Callouts */}
            {rule.callouts && rule.callouts.length > 0 && (
              <div className="space-y-3">
                {rule.callouts.map((callout, idx) => (
                  <RuleCallout key={idx} callout={callout} />
                ))}
              </div>
            )}

            {/* Detailed Official Rule Text */}
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed font-sans border-t border-white/10 pt-4">
              <span className="text-xs font-tech font-bold uppercase tracking-wider text-gray-400 block">
                Official Legislation Text
              </span>
              {rule.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-dark-950/80">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-tech font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Close
            </button>

            <a
              href={`/rules#${rule.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-vital-500 hover:bg-vital-400 text-dark-950 font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)]"
            >
              <span>View In Full Legislation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
