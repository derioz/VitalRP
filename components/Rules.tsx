'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Drama,
  Heart,
  RefreshCw,
  Eye,
  Zap,
  Crosshair,
  LogOut,
  Ban,
  AlertOctagon,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { RULES } from '@/data/rules';
import { Button } from './Button';
import { CoreRuleCard } from './rules/CoreRuleCard';
import { CoreRuleModal } from './rules/CoreRuleModal';

/**
 * 10 Core Foundational Rules of Vital RP
 * Highlighted on the landing page for quick reference.
 */
const CORE_RULES = [
  {
    id: 'server-age-restriction',
    ruleNumber: 1,
    title: 'Server Age Restriction (18+)',
    shortTitle: '18+ Server',
    tag: '18+ Strictly',
    summary: 'Vital RP is strictly an 18+ community with zero exceptions. Mature themes and adult roleplay occur regularly.',
    icon: ShieldAlert,
  },
  {
    id: 'stay-in-character',
    ruleNumber: 2,
    title: 'Stay in Character (No Breaking IC)',
    shortTitle: 'Stay In Character',
    tag: 'No Breaking IC',
    summary: 'Never break character during active scenes. If a rule break occurs, roleplay through it and submit a report afterward.',
    icon: Drama,
  },
  {
    id: 'fear-rp',
    ruleNumber: 3,
    title: 'Value of Life (Fear Roleplay)',
    shortTitle: 'Value of Life (FearRP)',
    tag: 'FearRP',
    summary: 'You must realistically value your life at all times. Comply when facing direct, unavoidable lethal threats like a gun to your head.',
    icon: Heart,
  },
  {
    id: 'new-life-rule',
    ruleNumber: 4,
    title: 'New Life Rule (NLR)',
    shortTitle: 'New Life Rule (NLR)',
    tag: '30m NLR',
    summary: 'When flatbacked and respawned, you forget all memories leading to your death and cannot return to the scene for 30 minutes.',
    icon: RefreshCw,
  },
  {
    id: 'metagaming',
    ruleNumber: 5,
    title: 'Meta Gaming (MG)',
    shortTitle: 'No Metagaming',
    tag: 'No OOC Info',
    summary: 'Using Out-Of-Character information from Discord, streams, or external messages in-character is strictly prohibited.',
    icon: Eye,
  },
  {
    id: 'powergaming',
    ruleNumber: 6,
    title: 'Powergaming (PG)',
    shortTitle: 'No Powergaming',
    tag: 'Fair Play',
    summary: 'Do not force unpreventable outcomes, perform physically impossible feats, or deny other players a fair chance to react.',
    icon: Zap,
  },
  {
    id: 'rdm-vdm',
    ruleNumber: 7,
    title: 'Random & Vehicle Deathmatch (RDM / VDM)',
    shortTitle: 'No RDM / VDM',
    tag: 'Valid Initiation',
    summary: 'Attacking or running over players without valid in-character reasoning and clear prior verbal initiation is strictly banned.',
    icon: Crosshair,
  },
  {
    id: 'combat-logging',
    ruleNumber: 8,
    title: 'Combat Logging',
    shortTitle: 'No Combat Logging',
    tag: 'Min 24h Ban',
    summary: 'Disconnecting, force-quitting, or respawning to escape arrest, death, robbery, or hostile RP carries an immediate 24h ban.',
    icon: LogOut,
  },
  {
    id: 'exploits-cheating',
    ruleNumber: 9,
    title: 'Exploits & Cheating',
    shortTitle: 'No Exploiting',
    tag: 'Anti-Cheat',
    summary: 'Abusing server bugs, crosshair overlays, macros, duplicated items, or third-party software results in an instant permanent ban.',
    icon: Ban,
  },
  {
    id: 'zero-tolerance-conduct',
    ruleNumber: 10,
    title: 'Zero Tolerance Conduct',
    shortTitle: 'Zero Tolerance',
    tag: 'Zero Tolerance',
    summary: 'Racism, hate speech, slurs, discrimination, non-consensual sexual RP, and suicide RP result in immediate permanent removal.',
    icon: AlertOctagon,
  },
];

/**
 * Compact, Pretty Core Rules section for the Vital RP homepage.
 * Renders the 10 foundational rules in a symmetrical 2-row spotlight grid.
 * Links to `/rules` for the complete 40+ rule legislation document.
 */
export const Rules: React.FC = () => {
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);

  // Look up full rule data from source of truth when modal opens
  const selectedRule = activeRuleId
    ? RULES.find((r) => r.id === activeRuleId) || null
    : null;

  const selectedCoreRule = activeRuleId
    ? CORE_RULES.find((r) => r.id === activeRuleId)
    : null;

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

        {/* 10 Core Rules Spotlight Grid (Symmetrical 2 rows of 5 on desktop) */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-10"
        >
          {CORE_RULES.map((rule) => (
            <div key={rule.id}>
              <CoreRuleCard
                id={rule.id}
                ruleNumber={rule.ruleNumber}
                title={rule.title}
                shortTitle={rule.shortTitle}
                tag={rule.tag}
                summary={rule.summary}
                icon={rule.icon}
                onSelect={(id) => setActiveRuleId(id)}
              />
            </div>
          ))}
        </div>

        {/* Bottom Legislation Banner */}
        <div className="p-6 md:p-8 rounded border border-white/10 bg-dark-900/80">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-display font-black text-white tracking-tight">
                Need the complete server legislation?
              </h3>
              <p className="text-sm text-gray-300 mt-1 max-w-2xl font-sans leading-relaxed">
                Robbery caps, heist cooldowns, gang conflict escalation, police response limits, and Extraction Island kill-on-sight guidelines are in the full document of 40+ rules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <Button href="/rules" icon={<FileText className="w-4 h-4" />}>
                View all rules
              </Button>
              <Button
                href="https://docs.google.com/document/d/1ZhxNk5zCsZy9eE1Xlo8ALanxtjsFV6TclpAoNHUZHpo/edit?tab=t.0"
                target="_blank"
                rel="noreferrer"
                variant="outline"
                icon={<ExternalLink className="w-4 h-4" />}
              >
                Google Doc
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quick View Detail Modal */}
      <CoreRuleModal
        rule={selectedRule}
        ruleNumber={selectedCoreRule?.ruleNumber}
        onClose={() => setActiveRuleId(null)}
      />
    </section>
  );
};