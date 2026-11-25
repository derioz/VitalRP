import React from 'react';
import Image from 'next/image';
import { articles, type Article } from '@/lib/gta6/content';

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

/**
 * The development journal, shown under the roadmap. Until there is a real
 * article it is a single honest line.
 */
export function Journal() {
  return (
    <div id="journal" className="g6-rule mt-16 scroll-mt-28 lg:mt-20">
      {articles.length > 0 ? (
        <>
          <h3 className="g6-display g6-sm mt-8 text-3xl text-white">Development journal</h3>
          <div className="mt-10 grid gap-x-10 gap-y-14 lg:grid-cols-2">
            {articles.map((a, i) => (
              <ArticleCard key={a.slug} article={a} featured={i === 0} />
            ))}
          </div>
        </>
      ) : (
        <p className="g6-body max-w-[72ch] pt-6">
          <span className="text-white">No journal entries yet.</span> When the team has something real
          to say, it will appear here. We will not post filler to make this look busy.
        </p>
      )}
    </div>
  );
}
