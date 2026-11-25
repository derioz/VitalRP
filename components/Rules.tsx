'use client';

import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { loadPublishedRules, type PublishedRule } from '@/lib/rules/published';
import { Button } from './Button';
import { CoreRuleCard } from './rules/CoreRuleCard';
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
    <section id="rules" className="py-20 relative overflow-hidden scroll-mt-20">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-dark-950/95 z-0" />

      {/* Top separator line */}
      <div className="absolute top-0 left-0 w-full h-px bg-white/10 z-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-12 max-w-3xl">
          <div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
              Ten rules everyone follows
            </h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed font-sans">
              The foundations of everyday life in Los Santos. Every player is expected to know and follow these.
            </p>
          </div>
        </div>

        {unavailable ? (
          <p role="status" className="mb-10 border-y border-white/10 py-6 text-gray-200">
            The current rules could not be loaded here.{' '}
            <a href="/rules" className="text-vital-400 underline underline-offset-4 hover:text-vital-300">
              Read them on the rules page
            </a>
            .
          </p>
        ) : (
          <div
            aria-busy={!published}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-10"
          >
            {published
              ? coreRules.map((rule) => (
                  <div key={rule.id}>
                    <CoreRuleCard
                      ruleNumber={rule.number}
                      id={rule.id}
                      shortTitle={rule.shortTitle || rule.title}
                      tag={rule.callouts?.find((c) => c.type === 'COOLDOWN')?.title}
                      summary={rule.summary}
                      onSelect={(id) => setActiveRuleId(id)}
                    />
                  </div>
                ))
              : CORE_RULE_IDS.map((id) => (
                  <div key={id} className="h-56 rounded border border-white/10 bg-dark-900/60" />
                ))}
          </div>
        )}

        {/* Bottom Legislation Banner */}
        <div className="p-6 md:p-8 rounded border border-white/10 bg-dark-900/80">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-display font-black text-white tracking-tight">
                Need the complete server legislation?
              </h3>
              <p className="text-sm text-gray-300 mt-1 max-w-2xl font-sans leading-relaxed">
                Robbery caps, heist cooldowns, gang conflict escalation, police response limits, and Extraction Island guidelines are in the full rulebook{published ? ` of ${published.length} rules` : ''}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <Button href="/rules" icon={<FileText className="w-4 h-4" />}>
                View all rules
              </Button>
            </div>
          </div>
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