import type { Metadata } from 'next';
import { CharacterPageView } from '@/components/wiki/CharacterPageView';
import { getFallbackCharacterBySlug } from '@/data/wiki-fallback';
import { getServerCharacterBySlug } from '@/lib/wiki/server-store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let charName = slug;
  let charSummary = 'Citizen of Los Santos on Vital Roleplay.';
  let avatarUrl = 'https://r2.fivemanage.com/image/T0Q31BrvyOVQ.png';

  try {
    const serverChar = await getServerCharacterBySlug(slug);
    if (serverChar) {
      charName = serverChar.character?.full_name || serverChar.title || charName;
      charSummary = serverChar.summary || charSummary;
      avatarUrl = serverChar.character?.avatar_url || avatarUrl;
    }
  } catch {
    // Fallback
  }

  if (charName === slug) {
    const fallback = getFallbackCharacterBySlug(slug);
    if (fallback) {
      charName = fallback.character.full_name;
      charSummary = fallback.summary || charSummary;
      avatarUrl = fallback.character.avatar_url || avatarUrl;
    }
  }

  const title = `${charName} | Vital RP Wiki`;
  const canonicalUrl = `https://vitalrp.net/wiki/characters/${slug}`;

  return {
    title,
    description: charSummary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'profile',
      url: canonicalUrl,
      title,
      description: charSummary,
      siteName: 'Vital RP Character Wiki',
      images: [
        {
          url: avatarUrl,
          width: 800,
          height: 800,
          alt: `${charName} Profile Photo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: charSummary,
      images: [avatarUrl],
    },
  };
}

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CharacterPageView slug={slug} />;
}
