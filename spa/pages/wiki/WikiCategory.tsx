import React from 'react';
import { useParams } from 'react-router-dom';
import { WikiCategoryView } from '../../../components/wiki/WikiCategoryView';

export const WikiCategory: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <WikiCategoryView categorySlug={slug || 'characters'} />;
};
