import type { Metadata } from 'next';
import { WikiHomeView } from '@/components/wiki/WikiHomeView';

export const metadata: Metadata = {
  title: 'Character Wiki | Vital RP',
  description:
    'Explore the living world, character histories, syndicates, and factions of the Vital RP FiveM community.',
  openGraph: {
    type: 'website',
    url: 'https://vitalrp.net/wiki',
    title: 'Character Wiki | Vital RP',
    description:
      'Explore character histories, syndicates, businesses, and stories in Los Santos.',
    siteName: 'Vital RP',
    images: ['https://r2.fivemanage.com/image/T0Q31BrvyOVQ.png'],
  },
};

export default function WikiHomePage() {
  return <WikiHomeView />;
}
