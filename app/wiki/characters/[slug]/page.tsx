import type { Metadata } from 'next';
import { CharacterPageView } from '@/components/wiki/CharacterPageView';
import { getFallbackCharacterBySlug } from '@/data/wiki-fallback';
import { createAdminClient } from '@/lib/supabase/admin';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let charName = slug;
  let charSummary = 'Citizen of Los Santos on Vital Roleplay.';
  let avatarUrl = 'https://r2.fivemanage.com/image/T0Q31BrvyOVQ.png';

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data: page } = await supabase
        .from('wiki_pages')
        .select(`
          title,
          summary,
          wiki_characters (
            full_name,
            avatar_url
          )
        `)
        .eq('slug', slug.toLowerCase())
        .maybeSingle();

      if (page) {
        const char = Array.isArray(page.wiki_characters)
          ? page.wiki_characters[0]
          : page.wiki_characters;
        charName = char?.full_name || page.title;
        charSummary = page.summary || charSummary;
        avatarUrl = char?.avatar_url || avatarUrl;
      }
    } catch {
      // Fallback
    }
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
