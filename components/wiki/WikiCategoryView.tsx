'use client';

import React from 'react';
import { CharacterDirectoryView } from './CharacterDirectoryView';

interface WikiCategoryViewProps {
  categorySlug: string;
}

export const WikiCategoryView: React.FC<WikiCategoryViewProps> = ({ categorySlug }) => {
  return <CharacterDirectoryView initialCategory={categorySlug} />;
};
