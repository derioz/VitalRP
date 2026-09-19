'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Ban, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import { RuleCallout as RuleCalloutType } from '@/data/rules';

interface RuleCalloutProps {
  callout: RuleCalloutType;
}

const calloutConfig = {
  IMPORTANT: {
    icon: AlertCircle,
    label: 'IMPORTANT',
    container: 'bg-vital-500/5 border-vital-500/30 text-vital-300',
    iconColor: 'text-vital-500',
    badge: 'bg-vital-500/10 text-vital-400 border-vital-500/20',
  },
  WARNING: {
    icon: AlertTriangle,
    label: 'WARNING',
    container: 'bg-amber-500/5 border-amber-500/30 text-amber-200',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  NOT_ALLOWED: {
    icon: Ban,
    label: 'PROHIBITED',
    container: 'bg-rose-500/5 border-rose-500/30 text-rose-200',
    iconColor: 'text-rose-500',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  COOLDOWN: {
    icon: Clock,
    label: 'COOLDOWN',
    container: 'bg-purple-500/5 border-purple-500/30 text-purple-200',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  },
  REQUIRES_APPROVAL: {
    icon: ShieldCheck,
    label: 'STAFF APPROVAL',
    container: 'bg-emerald-500/5 border-emerald-500/30 text-emerald-200',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  },
  EXAMPLE: {
    icon: HelpCircle,
    label: 'EXAMPLE SCENARIO',
    container: 'bg-sky-500/5 border-sky-500/30 text-sky-200',
    iconColor: 'text-sky-400',
    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  },
};

/**
 * 21st.dev Callout component for structured rule notices and warnings.
 */
export const RuleCallout: React.FC<RuleCalloutProps> = ({ callout }) => {
  const config = calloutConfig[callout.type] || calloutConfig.IMPORTANT;
  const Icon = config.icon;

  return (
    <div
      className={`my-3 p-4 rounded-xl border backdrop-blur-sm flex items-start gap-3 transition-colors ${config.container}`}
    >
      <div className={`mt-0.5 p-1 rounded-lg bg-white/5 flex-shrink-0 ${config.iconColor}`}>
        <Icon className="w-4 h-4 stroke-[2.2]" />
      </div>
      <div className="flex-1 text-xs sm:text-sm font-sans leading-relaxed">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.badge}`}>
            {config.label}
          </span>
          {callout.title && (
            <span className="font-display font-bold text-white tracking-wide">
              {callout.title}
            </span>
          )}
        </div>
        <p className="text-gray-300 mt-1 whitespace-pre-line font-normal">
          {callout.text}
        </p>
      </div>
    </div>
  );
};
