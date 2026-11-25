'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LORE_DISCLAIMER, LORE_STATEMENT, loreTopics, sectionNo, type LoreTopic } from '@/lib/gta6/content';
import { InlineList } from './InlineList';

/**
 * "Built around the lore of GTA VI".
 *
 * Structure follows the "Media Accordion" idea from 21st.dev (shadcnspace,
 * accordion-05): an accordion whose open item brings its picture with it.
 * Rebuilt on the shadcn Accordion already in the project so that, on large
 * screens, the picture lives in one sticky frame beside the list and
 * crossfades (opacity only), and on small screens it sits inside the open
 * item like the original.
 */

/** Height of the site header plus the section strip. */
const HEADER_CLEARANCE = 108;

function Credit() {
  return <p className="g6-mono mt-3 text-xs text-[#a39b90]">Promotional image, Rockstar Games</p>;
}

function TopicBody({ topic }: { topic: LoreTopic }) {
  return (
    <div className="g6-open-in max-w-[60ch]">
      <p className="text-xl leading-snug text-[#f4efe8]">{topic.summary}</p>
      <p className="g6-tag mt-5">What we intend to do</p>
      <ul className="g6-body mt-3 space-y-3 text-base">
        {topic.points.map((p) => (
          <li key={p} className="flex gap-3">
            <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-[#e8789e]" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      {topic.seen && (
        <div className="mt-6">
          <p className="g6-mono text-xs text-[#a39b90]">{topic.seen.label}</p>
          <InlineList items={topic.seen.items} className="mt-2 text-base leading-relaxed text-[#f4efe8]" />
        </div>
      )}

      {topic.caveat && <p className="g6-note">{topic.caveat}</p>}

      {/* Small screens: the picture belongs to the open item */}
      <div className="mt-6 lg:hidden">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image src={topic.image.src} alt={topic.image.alt} fill sizes="100vw" className="object-cover" />
        </div>
        <Credit />
      </div>
    </div>
  );
}

export function Lore() {
  const [open, setOpen] = useState<string>(loreTopics[0].id);
  // The frame keeps showing the last topic after an item is collapsed
  const [shown, setShown] = useState<string>(loreTopics[0].id);

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const settle = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const onChange = (value: string) => {
    setOpen(value);
    window.clearTimeout(settle.current);
    if (!value) return;
    setShown(value);
    // Closing a longer item above can carry the tapped heading off screen.
    // Once both panels have finished moving, bring it back below the header.
    settle.current = window.setTimeout(() => {
      const item = itemRefs.current[value];
      if (!item) return;
      const { top } = item.getBoundingClientRect();
      if (top >= HEADER_CLEARANCE && top < window.innerHeight * 0.75) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: top - HEADER_CLEARANCE - 8, behavior: reduced ? 'instant' : 'smooth' });
    }, 280);
  };

  return (
    <section id="lore" aria-labelledby="g6-lore-title" className="g6-section g6-rule">
      <div className="g6-wrap">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          <p className="g6-mono hidden pt-3 text-sm text-[#a39b90] lg:col-span-1 lg:block">{sectionNo('lore')}</p>
          <div className="lg:col-span-11">
            <h2
              id="g6-lore-title"
              className="g6-display text-[clamp(2.75rem,6.6vw,6.25rem)] text-white"
            >
              Built around the lore of GTA&nbsp;VI
            </h2>
          </div>

          <div className="lg:col-span-6 lg:col-start-2">
            <p className="max-w-[28ch] text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.2] text-[#f4efe8]">
              &ldquo;{LORE_STATEMENT}&rdquo;
            </p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="g6-body text-lg">
              We want players to feel like they are living in Rockstar&apos;s world, not on a heavily
              modified version of it. We build on the foundation Rockstar made rather than replace
              it with a fictional world of our own.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-x-12 gap-y-10 lg:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-6 lg:col-start-2">
            <Accordion
              type="single"
              collapsible
              value={open}
              onValueChange={onChange}
              className="border-t border-white/10"
            >
              {loreTopics.map((t, i) => (
                <AccordionItem
                  key={t.id}
                  value={t.id}
                  ref={(el) => {
                    itemRefs.current[t.id] = el;
                  }}
                  className="border-white/10"
                >
                  <AccordionTrigger className="items-baseline gap-5 py-5 text-white hover:text-[#fdba74] data-[state=open]:text-white">
                    <span className="flex items-baseline gap-5 text-left">
                      <span className="g6-mono w-6 shrink-0 text-sm text-[#a39b90]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="g6-display g6-sm text-2xl sm:text-3xl">{t.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8 pl-11">
                    <TopicBody topic={t} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <p className="g6-note">{LORE_DISCLAIMER}</p>
          </div>

          {/* Large screens: one sticky frame, crossfading between topics */}
          <div className="hidden lg:col-span-5 lg:col-start-8 lg:block">
            <div className="sticky top-36">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#111010]">
                {loreTopics.map((t) => (
                  <Image
                    key={t.id}
                    src={t.image.src}
                    alt={t.id === shown ? t.image.alt : ''}
                    aria-hidden={t.id !== shown}
                    fill
                    sizes="40vw"
                    className="g6-photo object-cover"
                    data-on={t.id === shown}
                  />
                ))}
              </div>
              <Credit />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
