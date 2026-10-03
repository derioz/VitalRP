import type { Metadata } from 'next';
import { WikiCategoryView } from '@/components/wiki/WikiCategoryView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Category: ${slug.toUpperCase()} | Vital RP Wiki`,
    description: `Browse characters in the ${slug} category on the Vital RP Wiki.`,
  };
}

export default async function WikiCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <WikiCategoryView categorySlug={slug} />;
}
