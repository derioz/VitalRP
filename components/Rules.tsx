'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
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
  BookOpen,
  FileText,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { RULES } from '@/data/rules';
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

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

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
      <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-md z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-vital-500/[0.04] blur-[160px] rounded-full pointer-events-none" />

      {/* Top separator line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-vital-900/60 to-transparent z-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vital-500/10 border border-vital-500/20 text-vital-400 text-xs font-tech font-bold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-vital-500 animate-pulse" />
              Core Directives
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4 uppercase tracking-tight">
              SERVER <span className="text-vital-500">CORE RULES</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-sans">
              The foundational pillars that govern everyday life in Los Santos. Every citizen is required to know and uphold these 10 directives.
            </p>
          </motion.div>
        </div>

        {/* 10 Core Rules Spotlight Grid (Symmetrical 2 rows of 5 on desktop) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-10"
        >
          {CORE_RULES.map((rule) => (
            <motion.div key={rule.id} variants={itemVariants}>
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
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Legislation Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-r from-dark-900/90 via-dark-800/80 to-dark-900/90 border border-white/[0.08] hover:border-vital-500/30 transition-all duration-300 backdrop-blur-md overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-vital-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-vital-500/10 border border-vital-500/20 flex items-center justify-center text-vital-500 flex-shrink-0 mt-0.5">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-tech font-bold uppercase tracking-wider text-vital-400 bg-vital-500/10 px-2 py-0.5 rounded border border-vital-500/20">
                    OFFICIAL DOCUMENTATION
                  </span>
                  <span className="text-xs text-gray-500 font-tech font-semibold">
                    40+ ARTICLES
                  </span>
                </div>
                <h3 className="text-xl font-display font-black text-white tracking-tight uppercase">
                  NEED THE COMPLETE SERVER LEGISLATION?
                </h3>
                <p className="text-sm text-gray-400 mt-1 max-w-2xl font-sans leading-relaxed">
                  Detailed robbery caps, heist cooldowns, gang conflict escalation, police response limits, and Extraction Island kill-on-sight guidelines are documented in our full legislation.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end flex-shrink-0">
              <a
                href="/rules"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-vital-500 hover:bg-vital-400 text-dark-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all duration-200 group"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Legislation (40+ Rules)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="https://docs.google.com/document/d/1ZhxNk5zCsZy9eE1Xlo8ALanxtjsFV6TclpAoNHUZHpo/edit?tab=t.0"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/10 hover:border-white/20 text-xs font-tech font-bold uppercase tracking-wider transition-all duration-200"
              >
                <span>Official Google Doc</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </a>
            </div>
          </div>
        </motion.div>
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