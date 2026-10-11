'use client';

import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Ban,
  Clock,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { RuleCallout as RuleCalloutType } from '@/data/rules';
import { renderFormattedInline } from './FormattedRuleText';

interface RuleCalloutProps {
  callout: RuleCalloutType;
}

const colorThemes: Record<
  string,
  { container: string; iconColor: string; badge: string; linkBtn: string }
> = {
  cyan: {
    container: 'bg-cyan-500/5 border-cyan-500/30 text-cyan-200',
    iconColor: 'text-cyan-400',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    linkBtn: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30',
  },
  vital: {
    container: 'bg-vital-500/5 border-vital-500/30 text-vital-300',
    iconColor: 'text-vital-500',
    badge: 'bg-vital-500/10 text-vital-400 border-vital-500/20',
    linkBtn: 'bg-vital-500/15 hover:bg-vital-500/25 text-vital-300 border-vital-500/30',
  },
  emerald: {
    container: 'bg-emerald-500/5 border-emerald-500/30 text-emerald-200',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    linkBtn: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30',
  },
  purple: {
    container: 'bg-purple-500/5 border-purple-500/30 text-purple-200',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    linkBtn: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/30',
  },
  rose: {
    container: 'bg-rose-500/5 border-rose-500/30 text-rose-200',
    iconColor: 'text-rose-500',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    linkBtn: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30',
  },
  amber: {
    container: 'bg-amber-500/5 border-amber-500/30 text-amber-200',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    linkBtn: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30',
  },
  blue: {
    container: 'bg-blue-500/5 border-blue-500/30 text-blue-200',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    linkBtn: 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/30',
  },
  fuchsia: {
    container: 'bg-fuchsia-500/5 border-fuchsia-500/30 text-fuchsia-200',
    iconColor: 'text-fuchsia-400',
    badge: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
    linkBtn: 'bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 border-fuchsia-500/30',
  },
};

const baseCalloutConfig = {
  IMPORTANT: {
    icon: AlertCircle,
    label: 'IMPORTANT',
    container: 'bg-vital-500/5 border-vital-500/30 text-vital-300',
    iconColor: 'text-vital-500',
    badge: 'bg-vital-500/10 text-vital-400 border-vital-500/20',
    linkBtn: 'bg-vital-500/15 hover:bg-vital-500/25 text-vital-300 border border-vital-500/30',
  },
  WARNING: {
    icon: AlertTriangle,
    label: 'WARNING',
    container: 'bg-amber-500/5 border-amber-500/30 text-amber-200',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    linkBtn: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30',
  },
  NOT_ALLOWED: {
    icon: Ban,
    label: 'PROHIBITED',
    container: 'bg-rose-500/5 border-rose-500/30 text-rose-200',
    iconColor: 'text-rose-500',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    linkBtn: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30',
  },
  PROHIBITED: {
    icon: Ban,
    label: 'PROHIBITED',
    container: 'bg-rose-500/5 border-rose-500/30 text-rose-200',
    iconColor: 'text-rose-500',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    linkBtn: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30',
  },
  COOLDOWN: {
    icon: Clock,
    label: 'COOLDOWN',
    container: 'bg-purple-500/5 border-purple-500/30 text-purple-200',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    linkBtn: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30',
  },
  REQUIRES_APPROVAL: {
    icon: ShieldCheck,
    label: 'STAFF APPROVAL',
    container: 'bg-emerald-500/5 border-emerald-500/30 text-emerald-200',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    linkBtn: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30',
  },
  STAFF_APPROVAL: {
    icon: ShieldCheck,
    label: 'STAFF APPROVAL',
    container: 'bg-emerald-500/5 border-emerald-500/30 text-emerald-200',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    linkBtn: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30',
  },
  EXAMPLE: {
    icon: HelpCircle,
    label: 'EXAMPLE SCENARIO',
    container: 'bg-sky-500/5 border-sky-500/30 text-sky-200',
    iconColor: 'text-sky-400',
    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    linkBtn: 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30',
  },
  CUSTOM: {
    icon: Sparkles,
    label: 'CUSTOM',
    container: 'bg-cyan-500/5 border-cyan-500/30 text-cyan-200',
    iconColor: 'text-cyan-400',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    linkBtn: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30',
  },
};

/**
 * 21st.dev Callout component for structured rule notices and warnings.
 * Supports Warning, Prohibited, Important, Staff Approval, Cooldown, Custom, and Example.
 * Now renders inline markdown links [text](url) and optional direct link attachments.
 */
export const RuleCallout: React.FC<RuleCalloutProps> = ({ callout }) => {
  const isCustom = callout.type === 'CUSTOM';
  const customTheme = isCustom && callout.customColor ? colorThemes[callout.customColor] : null;

  const baseConfig = baseCalloutConfig[callout.type] || baseCalloutConfig.IMPORTANT;
  const Icon = baseConfig.icon;

  const container = customTheme?.container || baseConfig.container;
  const iconColor = customTheme?.iconColor || baseConfig.iconColor;
  const badge = customTheme?.badge || baseConfig.badge;
  const linkBtn = customTheme?.linkBtn || baseConfig.linkBtn;
  const label = isCustom ? callout.customLabel || 'CUSTOM' : baseConfig.label;

  const isExternalLink =
    callout.linkUrl?.startsWith('http://') || callout.linkUrl?.startsWith('https://');

  return (
    <div
      className={`my-3 p-4 rounded-xl border backdrop-blur-sm flex items-start gap-3 transition-colors ${container}`}
    >
      <div className={`mt-0.5 p-1 rounded-lg bg-white/5 flex-shrink-0 ${iconColor}`}>
        <Icon className="w-4 h-4 stroke-[2.2]" />
      </div>
      <div className="flex-1 text-xs sm:text-sm font-sans leading-relaxed">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span
            className={`text-[10px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge}`}
          >
            {label}
          </span>
          {callout.title && (
            <span className="font-display font-bold text-white tracking-wide">
              {callout.title}
            </span>
          )}
        </div>

        <div className="text-gray-300 mt-1 font-normal leading-relaxed whitespace-pre-line">
          {renderFormattedInline(callout.text)}
        </div>

        {callout.linkUrl && (
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center">
            <a
              href={callout.linkUrl}
              target={isExternalLink ? '_blank' : undefined}
              rel={isExternalLink ? 'noopener noreferrer' : undefined}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${linkBtn}`}
            >
              <span>{callout.linkText || 'Learn More / Reference'}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
