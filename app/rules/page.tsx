import type { Metadata } from 'next';
import React from 'react';
import RulesPageClient from './RulesPageClient';

export const metadata: Metadata = {
  title: 'Vital RP Server Rules | Vital Roleplay',
  description:
    'Official server rules and legislation for Vital Roleplay (Vital RP). Review our server constitution, FearRP, New Life Rule, heist limits, faction guidelines, and community conduct.',
  openGraph: {
    title: 'Vital RP Server Rules | Vital Roleplay',
    description:
      'Official server rules and legislation for Vital Roleplay (Vital RP). Serious roleplay works when everyone understands the expectations.',
    url: 'https://vitalrp.net/rules',
    siteName: 'Vital Roleplay',
    type: 'website',
  },
  alternates: {
    canonical: 'https://vitalrp.net/rules',
  },
};

export default function RulesPage() {
  return <RulesPageClient />;
}
