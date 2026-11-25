import React from 'react';
import { concepts, sectionNo } from '@/lib/gta6/content';
import { SupplyChain } from './SupplyChain';
import { InlineList } from './InlineList';

/**
 * Roleplay concepts as a ledger: one ruled row per concept, with the
 * native-first approach stated on every row. Deliberately text only, so it
 * reads differently from the photographic lore and lifestyle sections.
 * Each row keeps a stable id (concept-<slug>) so it can become its own page.
 */
export function Concepts() {
  return (
    <section id="concepts" aria-labelledby="g6-concepts-title" className="g6-section g6-rule">
      <div className="g6-wrap grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-40">
            <p className="g6-mono pb-6 text-sm text-[#a39b90]">{sectionNo('concepts')}</p>
            <h2
              id="g6-concepts-title"
              className="g6-display text-[clamp(2.75rem,5.5vw,5rem)] text-white"
            >
              Roleplay concepts
            </h2>
            <p className="g6-body mt-6 max-w-[34ch] text-lg">
              Two ideas we are exploring. Both start from what Rockstar already built,
              and neither is a promise.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8">
          <ol className="border-t border-white/10">
            {concepts.map((c, i) => (
              <li key={c.slug} className="border-b border-white/10">
                <article id={`concept-${c.slug}`} className="grid gap-x-8 gap-y-4 py-9 sm:grid-cols-[3rem_1fr] lg:py-12">
                  <span className="g6-mono pt-2 text-sm text-[#a39b90]">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="g6-display g6-sm text-3xl text-white sm:text-4xl">{c.title}</h3>
                    <p className="g6-body mt-4 max-w-[60ch] text-lg">{c.summary}</p>

                    <p className="g6-tag mt-5">{c.native}</p>

                    {c.items.length > 0 && (
                      <InlineList items={c.items} className="mt-5 max-w-[64ch] text-base leading-relaxed text-[#f4efe8]" />
                    )}

                    {c.note && <p className="g6-note">{c.note}</p>}

                    {c.slug === 'interconnected-economy' && (
                      <div className="mt-8">
                        <p className="g6-mono mb-4 text-sm text-[#a39b90]">
                          Example: one dinner, five players. Select a step.
                        </p>
                        <SupplyChain />
                      </div>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
