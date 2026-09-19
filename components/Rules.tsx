'use client';

import React from 'react';
import { RulesView } from './rules/RulesView';

/**
 * Rules section component for Vital RP.
 * Completely redesigned using 21st.dev community components
 * and the complete official Vital RP rules legislation document.
 */
export const Rules: React.FC = () => {
  return (
    <section id="rules" className="relative scroll-mt-20">
      <RulesView />
    </section>
  );
};