'use client';

import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { loadPublishedRules, type PublishedRule } from '@/lib/rules/published';
import { Button } from './Button';
import { CoreRuleRow } from './rules/CoreRuleRow';
import { CoreRuleModal } from './rules/CoreRuleModal';

/**
 * Which rules the homepage highlights. Only the choice lives here: titles,
 * summaries, penalties and numbers all come from the published rulebook.
 */
const CORE_RULE_IDS = [
  'server-age-restriction',
  'stay-in-character',
  'fear-rp',
  'new-life-rule',
  'metagaming',
  'powergaming',
  'rdm-vdm',
  'combat-logging',
  'exploits-cheating',
  'zero-tolerance-conduct',
];

/**
 * Core rules on the homepage, linking to /rules for the rest.
 */
export const Rules: React.FC = () => {
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [published, setPublished] = useState<PublishedRule[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadPublishedRules()
      .then((rules) => mounted && setPublished(rules))
      .catch(() => mounted && setFailed(true));
    return () => {
      mounted = false;
    };
  }, []);

  const coreRules = (published || [])
    .filter((r) => CORE_RULE_IDS.includes(r.id))
    .sort((a, b) => a.number - b.number);
  const selectedRule = coreRules.find((r) => r.id === activeRuleId) || null;
  // Say so rather than showing an empty grid if the highlighted rules are missing
  const unavailable = failed || (published !== null && coreRules.length === 0);

  return (
    <section id="rules" className="relative scroll-mt-14 overflow-hidden pb-16 pt-8 md:pb-24 md:pt-12">
      {/* Same surface as the values above: how we play is one chapter */}
      <div className="absolute inset-0 bg-dark-900/95 z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-10 max-w-3xl md:mb-12">
          <h2 className="text-balance text-3xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
            Ten rules everyone follows
          </h2>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed font-sans">
            The foundations of everyday life in Los Santos. Every player is expected to know and follow these.
          </p>
        </div>

        {unavailable ? (
          <p role="status" className="mb-8 border-y border-white/10 py-6 text-gray-200">
            The current rules could not be loaded here.{' '}
            <a href="/rules" className="text-vital-400 underline underline-offset-4 hover:text-vital-300">
              Read them on the rules page
            </a>
            .
          </p>
        ) : (
          /* Two columns read downwards, so the numbers stay in order */
          <ul
            aria-busy={!published}
            className="mb-8 grid border-t border-white/10 md:grid-flow-col md:grid-cols-2 md:grid-rows-5 md:gap-x-10"
          >
            {published
              ? coreRules.map((rule) => (
                  <li key={rule.id} className="border-b border-white/10">
                    <CoreRuleRow
                      ruleNumber={rule.number}
                      id={rule.id}
                      shortTitle={rule.shortTitle || rule.title}
                      tag={rule.callouts?.find((c) => c.type === 'COOLDOWN')?.title}
                      onSelect={(id) => setActiveRuleId(id)}
                    />
                  </li>
                ))
              : CORE_RULE_IDS.map((id) => <li key={id} className="h-16 border-b border-white/10" />)}
          </ul>
        )}

        {/* The way on to the full rulebook */}
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-display font-black text-white tracking-tight">
              Need the complete server legislation?
            </h3>
            <p className="text-sm text-gray-300 mt-1 max-w-[65ch] font-sans leading-relaxed">
              Robbery caps, heist cooldowns, gang conflict escalation, police response limits, and Extraction Island guidelines are in the full rulebook{published ? ` of ${published.length} rules` : ''}.
            </p>
          </div>

          <Button href="/rules" icon={<FileText className="w-4 h-4" />} className="flex-shrink-0">
            View all rules
          </Button>
        </div>
      </div>

      {/* Interactive Quick View Detail Modal */}
      <CoreRuleModal
        rule={selectedRule}
        ruleNumber={selectedRule?.number}
        categoryTitle={selectedRule?.categoryTitle}
        onClose={() => setActiveRuleId(null)}
      />
    </section>
  );
};