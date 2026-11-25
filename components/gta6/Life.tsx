'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISCORD_URL, LIFE_NOTE, lifestyles, sectionNo } from '@/lib/gta6/content';
import { InlineList } from './InlineList';
import { SlidingIndicator } from '../SlidingIndicator';

/**
 * "Life in Leonida". The functional base is shadcn/ui Tabs (Radix: arrow keys,
 * Home/End, roving focus). The image-led selector follows the cinematic image
 * showcase pattern popular on 21st.dev, simplified: one framed photograph
 * that crossfades (opacity only) while the copy beside it swaps.
 */
export function Life() {
  const [active, setActive] = useState(lifestyles[0].id);

  return (
    <section id="life" aria-labelledby="g6-life-title" className="g6-paper g6-section">
      <div className="g6-wrap">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          <p className="g6-mono hidden pt-3 text-sm lg:col-span-1 lg:block g6-paper-body">{sectionNo('life')}</p>
          <div className="lg:col-span-11">
            <h2 id="g6-life-title" className="g6-display text-[clamp(3rem,8vw,7.5rem)]">
              Life in Leonida
            </h2>
          </div>
          <p className="g6-paper-body max-w-[56ch] text-lg lg:col-span-6 lg:col-start-2">
            Five ways an ordinary week could look. Pick one to see what it might involve.
          </p>
        </div>

        <Tabs value={active} onValueChange={setActive} className="mt-14 lg:mt-20">
          <div className="g6-strip -mx-5 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:overflow-visible lg:px-0">
            <TabsList
              aria-label="Ways to live in Leonida"
              className="relative flex w-max items-stretch gap-x-6 border-b border-[rgb(23_18_13/0.18)] lg:w-full lg:gap-x-12"
            >
              {lifestyles.map((l, i) => (
                <TabsTrigger
                  key={l.id}
                  value={l.id}
                  className="group relative -mb-px flex items-baseline gap-3 border-b-2 border-transparent pb-4 pt-1 text-left text-[#17120d]/60 hover:text-[#17120d] data-[state=active]:text-[#17120d]"
                >
                  <span className="g6-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                  <span className="g6-display g6-sm text-xl lg:text-[clamp(1.25rem,2vw,1.875rem)]">
                    {l.title.replace('The ', '')}
                  </span>
                </TabsTrigger>
              ))}
              <SlidingIndicator
                selector='[role="tab"][data-state="active"]'
                activeKey={active}
                className="-bottom-px bg-[#b43f0a]"
              />
            </TabsList>
          </div>

          <div className="mt-10 grid gap-x-12 gap-y-10 lg:mt-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#17120d]">
                {lifestyles.map((l) => (
                  <Image
                    key={l.id}
                    src={l.image.src}
                    alt={l.id === active ? l.image.alt : ''}
                    aria-hidden={l.id !== active}
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="g6-photo object-cover"
                    data-on={l.id === active}
                  />
                ))}
              </div>
              <p className="g6-mono mt-3 text-xs g6-paper-body">Promotional image, Rockstar Games</p>
            </div>

            <div className="lg:col-span-5">
              {lifestyles.map((l) => (
                <TabsContent key={l.id} value={l.id} className="g6-arrive">
                  <h3 className="g6-display text-[clamp(2rem,3.6vw,3.25rem)]">{l.tagline}</h3>
                  <p className="g6-paper-body mt-5 max-w-[48ch] text-lg">{l.summary}</p>

                  <div className="mt-8">
                    <p className="g6-mono text-xs g6-paper-accent">Careers and activities</p>
                    <InlineList items={l.careers} className="mt-2 text-lg leading-relaxed" />
                  </div>

                  <div className="mt-8">
                    <p className="g6-mono text-xs g6-paper-accent">Roleplay it could lead to</p>
                    <ul className="g6-list mt-2">
                      {l.opportunities.map((o) => (
                        <li key={o} className="text-base">
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <p className="g6-mono text-xs g6-paper-accent">Connected to, in Rockstar&apos;s materials</p>
                    <p className="g6-paper-body mt-2 text-base">{l.connections.join(', ')}</p>
                  </div>
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>

        <p className="g6-note g6-paper-body mt-14 lg:ml-[calc(8.333%+1rem)]">{LIFE_NOTE}</p>

        {/* The ask sits where interest peaks, before the text-heavy concepts */}
        <div className="g6-paper-rule mt-14 flex flex-col items-start gap-6 pt-8 sm:flex-row sm:items-center sm:justify-between lg:ml-[calc(8.333%+1rem)]">
          <p className="g6-display g6-sm max-w-[24ch] text-2xl sm:text-3xl">
            Which of these would you play? Tell us in the Discord.
          </p>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="g6-btn g6-btn-primary shrink-0">
            Join Our Discord
          </a>
        </div>
      </div>
    </section>
  );
}
