import type { Metadata } from 'next';
import { CharacterBacklinksView } from '@/components/wiki/CharacterBacklinksView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Backlinks: ${slug} | Vital RP Wiki`,
    description: `What links to ${slug} on the Vital RP Character Wiki.`,
  };
}

export default async function CharacterBacklinksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CharacterBacklinksView slug={slug} />;
}
