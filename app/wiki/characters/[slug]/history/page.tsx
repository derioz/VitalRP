import type { Metadata } from 'next';
import { CharacterHistoryView } from '@/components/wiki/CharacterHistoryView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Revision History: ${slug} | Vital RP Wiki`,
    description: `Audit trail and version history for ${slug} on the Vital RP Character Wiki.`,
  };
}

export default async function CharacterHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CharacterHistoryView slug={slug} />;
}
