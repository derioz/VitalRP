import React from 'react';
import { useParams } from 'react-router-dom';
import { CharacterBacklinksView } from '../../../components/wiki/CharacterBacklinksView';

export const WikiCharacterBacklinks: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <CharacterBacklinksView slug={slug || 'damon-vox'} />;
};
