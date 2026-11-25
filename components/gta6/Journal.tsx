import React from 'react';
import Image from 'next/image';
import { articles, plannedTopics, sectionNo, type Article } from '@/lib/gta6/content';

/**
 * Preview card for a published development article. Not rendered until
 * `articles` has real entries. The article route does not exist yet, see
 * DESIGN.md before publishing the first one.
 */
export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const date = new Date(article.publishedAt);
  return (
    <article className={`group ${featured ? 'lg:col-span-2' : ''}`}>
      <a href={`/gta6/journal/${article.slug}`} className="block">
        {article.image && (
          <div className={`relative overflow-hidden ${featured ? 'aspect-[2/1]' : 'aspect-[3/2]'}`}>
            <Image
              src={article.image.src}
              alt={article.image.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="mt-5 flex items-baseline gap-4">
          <span className="g6-tag">{article.category}</span>
          <time dateTime={article.publishedAt} className="g6-mono text-sm text-[#a39b90]">
            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </time>
        </div>
        <h3 className="g6-display g6-sm mt-3 text-3xl text-white transition-colors group-hover:text-[#fdba74]">
          {article.title}
        </h3>
        <p className="g6-body mt-3 max-w-[52ch]">{article.description}</p>
      </a>
    </article>
  );
}

export function Journal() {
  const hasArticles = articles.length > 0;
  return (
    <section id="journal" aria-labelledby="g6-journal-title" className="g6-section g6-rule">
      <div className="g6-wrap">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          <h2
            id="g6-journal-title"
            className="g6-display text-[clamp(2.75rem,5.5vw,5rem)] text-white lg:col-span-9"
          >
            <span className="g6-mono mr-5 inline-block w-6 align-baseline text-sm text-[#a39b90]">{sectionNo('journal')}</span><span>Development journal</span>
          </h2>
        </div>

        {hasArticles ? (
          <div className="mt-16 grid gap-x-10 gap-y-14 lg:grid-cols-2">
            {articles.map((a, i) => (
              <ArticleCard key={a.slug} article={a} featured={i === 0} />
            ))}
          </div>
        ) : (
          <div className="mt-14 grid gap-x-12 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-2xl leading-snug text-white">No entries yet.</p>
              <p className="g6-body mt-4 max-w-[44ch] text-lg">
                When the team has something real to say, it goes here: concepts, decisions and
                what we change our minds about. We will not post filler to make this look busy.
              </p>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <p className="g6-mono mb-4 text-sm text-[#a39b90]">Topics we plan to write about</p>
              <ul className="g6-list">
                {plannedTopics.map((t) => (
                  <li key={t.title} className="flex items-baseline justify-between gap-6">
                    <span className="text-lg text-[#f4efe8]">{t.title}</span>
                    <span className="g6-mono shrink-0 text-sm text-[#a39b90]">{t.category}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
