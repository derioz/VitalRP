import type { Metadata } from 'next';
import { CharacterDirectoryView } from '@/components/wiki/CharacterDirectoryView';

export const metadata: Metadata = {
  title: 'Character Directory | Vital RP Wiki',
  description: 'Search and browse all active, inactive, and historic characters in Vital RP.',
  openGraph: {
    type: 'website',
    url: 'https://vitalrp.net/wiki/characters',
    title: 'Character Directory | Vital RP Wiki',
    description: 'Search and browse characters, factions, and businesses in Vital RP.',
    images: ['https://r2.fivemanage.com/image/T0Q31BrvyOVQ.png'],
  },
};

export default function WikiCharactersDirectoryPage() {
  return <CharacterDirectoryView />;
}
