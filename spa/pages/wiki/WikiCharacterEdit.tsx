import React from 'react';
import { useParams } from 'react-router-dom';
import { CharacterEditorView } from '../../../components/wiki/CharacterEditorView';

export const WikiCharacterEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <CharacterEditorView initialSlug={slug} isNew={false} />;
};
