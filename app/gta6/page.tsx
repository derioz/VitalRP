import type { Metadata } from 'next';
import React from 'react';
import { Gta6Page } from '@/components/gta6/Gta6Page';
import './gta6.css';

const title = 'GTA VI: The Next Chapter | Vital Roleplay';
const description =
  "Vital Roleplay's concept development for Grand Theft Auto VI. Our vision, the regions of Leonida and our roadmap for a story-first, roleplay-heavy server. Unofficial community project.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://vitalrp.net/gta6',
    siteName: 'Vital Roleplay',
    type: 'website',
    images: [
      {
        url: '/gta6/og-bay.jpg',
        width: 1200,
        height: 630,
        alt: 'A city skyline and harbor at dusk, from Rockstar Games promotional material for Grand Theft Auto VI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/gta6/og-bay.jpg'],
  },
  alternates: { canonical: 'https://vitalrp.net/gta6' },
};

export default function Page() {
  return <Gta6Page />;
}
