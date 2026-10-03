import React from 'react';
import { useParams } from 'react-router-dom';
import { CharacterPageView } from '../../../components/wiki/CharacterPageView';

export const WikiCharacterDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <CharacterPageView slug={slug || 'damon-vox'} />;
};
