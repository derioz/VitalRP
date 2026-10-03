import type { Metadata } from 'next';
import { CharacterEditorView } from '@/components/wiki/CharacterEditorView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Edit Character (${slug}) | Vital RP Wiki`,
    description: `Edit character details, overview, relationships, and history on the Vital RP Wiki.`,
  };
}

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CharacterEditorView initialSlug={slug} isNew={false} />;
}
