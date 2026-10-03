import React from 'react';
import { useParams } from 'react-router-dom';
import { CharacterHistoryView } from '../../../components/wiki/CharacterHistoryView';

export const WikiCharacterHistory: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <CharacterHistoryView slug={slug || 'damon-vox'} />;
};
