import type { Metadata } from 'next';
import { CharacterEditorView } from '@/components/wiki/CharacterEditorView';

export const metadata: Metadata = {
  title: 'Create Character | Vital RP Wiki',
  description: 'Create a new character profile on the Vital RP Wiki.',
};

export default function CreateWikiPage() {
  return <CharacterEditorView isNew={true} />;
}
