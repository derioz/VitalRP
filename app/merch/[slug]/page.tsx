import type { Metadata } from 'next';
import {
  findProductBySlug,
  FALLBACK_PRODUCTS,
} from '@/lib/merch/catalog';
import MerchProductClient from './MerchProductClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductBySlug(slug, FALLBACK_PRODUCTS);

  if (!product) {
    return {
      title: 'Drop Not Found | Vital RP Official Store',
      description: 'The requested merchandise drop could not be found.',
    };
  }

  const primaryImage = product.mockup_images[0]?.src || 'https://r2.fivemanage.com/image/6NG24OsqzUct.png';
  const fullImageUrl = primaryImage.startsWith('http')
    ? primaryImage
    : `https://vitalrp.net${primaryImage}`;
  const price = `$${(product.retail_price_cents / 100).toFixed(2)}`;
  const title = `${product.title} (${price}) | Vital RP Official Store`;
  const description = `${product.description} Official heavyweight merchandise for Los Santos citizens. Fast worldwide fulfillment.`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `https://vitalrp.net/merch/${product.slug}`,
      title,
      description,
      siteName: 'Vital RP • Official Store',
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
    },
    alternates: {
      canonical: `https://vitalrp.net/merch/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <MerchProductClient slug={slug} />;
}
