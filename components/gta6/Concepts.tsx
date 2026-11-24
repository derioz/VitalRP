import React from 'react';
import Image from 'next/image';
import { concepts, GTA6_IMAGES, worldChain, type Concept } from '@/lib/gta6/content';
import { Reveal } from './Reveal';
import { SupplyChain } from './SupplyChain';

/**
 * Seven concepts, seven compositions. Each block carries its slug as an id
 * (concept-<slug>) so it can become its own page later.
 */

function ConceptNote({ children }: { children: React.ReactNode }) {
  return <p className="g6-note">{children}</p>;
}

function Title({ concept, size = 'lg' }: { concept: Concept; size?: 'lg' | 'xl' }) {
  return (
    <h3
      className={`g6-display text-white ${
        size === 'xl'
          ? 'text-[clamp(2.75rem,6.5vw,6rem)]'
          : 'text-[clamp(2.25rem,4.6vw,4.25rem)]'
      }`}
    >
      {concept.title}
    </h3>
  );
}

/* 1. Business: title left, ruled two-column table right */
function Business() {
  const c = concepts.business;
  return (
    <article id={`concept-${c.slug}`} className="g6-rule py-16 lg:py-24">
      <div className="g6-wrap grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="g6-tag">{c.kicker}</p>
          <div className="mt-5">
            <Title concept={c} />
          </div>
          <p className="g6-body mt-8 max-w-[48ch] text-lg">{c.summary}</p>
          {c.note && <ConceptNote>{c.note}</ConceptNote>}
        </Reveal>
        <Reveal delay={80} className="lg:col-span-6 lg:col-start-7">
          <p className="g6-mono mb-4 text-sm text-[#a39b90]">Systems we want to explore</p>
          <ul className="g6-list grid gap-x-8 sm:grid-cols-2">
            {c.items.map((item, i) => (
              <li key={item} className="flex gap-4 text-lg text-[#f4efe8]">
                <span className="g6-mono w-6 pt-1 text-sm text-[#a39b90]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </article>
  );
}

/* 2. Economy: full-width interactive example */
function Economy() {
  const c = concepts.economy;
  return (
    <article id={`concept-${c.slug}`} className="border-y border-white/10 bg-[#0f0d0c] py-16 lg:py-24">
      <div className="g6-wrap">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="g6-tag">{c.kicker}</p>
            <div className="mt-5">
              <Title concept={c} />
            </div>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-5 lg:pt-12">
            <p className="g6-body text-lg">{c.summary}</p>
          </Reveal>
        </div>
        <div className="mt-12 lg:mt-16">
          <p className="g6-mono mb-4 text-sm text-[#a39b90]">
            Example: one dinner, five players. Select a step.
          </p>
          <SupplyChain />
        </div>
      </div>
    </article>
  );
}

/* 3. Civilian: the professions set as a typographic run, on paper */
function Civilian() {
  const c = concepts.civilian;
  return (
    <article id={`concept-${c.slug}`} className="g6-paper py-20 lg:py-32">
      <div className="g6-wrap">
        <Reveal>
          <p className="g6-tag g6-paper-accent">{c.kicker}</p>
          <div className="mt-5">
            <h3 className="g6-display text-[clamp(2.75rem,6.5vw,6rem)]">{c.title}</h3>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <p className="g6-display mt-14 max-w-[1100px] text-[clamp(1.75rem,4.2vw,3.75rem)] leading-[1.25]">
            {c.items.map((item, i) => (
              <React.Fragment key={item}>
                <span className="whitespace-nowrap">{item}</span>
                {i < c.items.length - 1 && <span className="g6-paper-accent px-[0.3em]">/</span>}{' '}
              </React.Fragment>
            ))}
          </p>
        </Reveal>
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <p className="g6-paper-body max-w-[52ch] text-lg lg:col-span-5 lg:col-start-2">{c.summary}</p>
        </div>
      </div>
    </article>
  );
}

/* 4. Weazel: a broadcast rundown */
function Media() {
  const c = concepts.media;
  return (
    <article id={`concept-${c.slug}`} className="g6-rule py-16 lg:py-24">
      <div className="g6-wrap grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-6 lg:order-2">
          <p className="g6-tag">{c.kicker}</p>
          <div className="mt-5">
            <Title concept={c} />
          </div>
          <p className="g6-body mt-8 max-w-[50ch] text-lg">{c.summary}</p>
          {c.note && <ConceptNote>{c.note}</ConceptNote>}
        </Reveal>
        <Reveal delay={80} className="lg:col-span-5 lg:order-1">
          <p className="g6-mono mb-4 text-sm text-[#a39b90]">Possible rundown</p>
          <ol className="g6-list">
            {c.items.map((item, i) => (
              <li key={item} className="flex items-baseline justify-between gap-6">
                <span className="g6-display g6-sm text-2xl text-white sm:text-3xl">{item}</span>
                <span className="g6-mono text-sm text-[#a39b90]">{String(i + 1).padStart(2, '0')}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </article>
  );
}

/* 5. Underworld: full-bleed image, text over it */
function Underworld() {
  const c = concepts.underworld;
  return (
    <article id={`concept-${c.slug}`} className="relative isolate overflow-hidden border-y border-white/10">
      <Image
        src={GTA6_IMAGES.underworld.src}
        alt={GTA6_IMAGES.underworld.alt}
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/20" />
      <div className="g6-wrap py-20 lg:py-32">
        <Reveal className="max-w-[640px]">
          <p className="g6-tag">{c.kicker}</p>
          <div className="mt-5">
            <Title concept={c} />
          </div>
          <p className="mt-8 text-lg leading-relaxed text-[#f4efe8]">{c.summary}</p>
          <ul className="g6-list mt-10 grid gap-x-8 sm:grid-cols-2">
            {c.items.map((item) => (
              <li key={item} className="text-base text-[#f4efe8]">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </article>
  );
}

/* 6. Government: narrow statement, wide index */
function Government() {
  const c = concepts.government;
  return (
    <article id={`concept-${c.slug}`} className="py-16 lg:py-28">
      <div className="g6-wrap grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4 lg:col-start-1">
          <p className="g6-tag">{c.kicker}</p>
          <div className="mt-5">
            <Title concept={c} />
          </div>
        </Reveal>
        <Reveal delay={60} className="lg:col-span-7 lg:col-start-6">
          <p className="g6-body text-lg">{c.summary}</p>
          <ul className="mt-10 grid grid-cols-1 border-t border-white/10 sm:grid-cols-2">
            {c.items.map((item) => (
              <li
                key={item}
                className="border-b border-white/10 py-5 text-lg text-[#f4efe8] sm:odd:border-r sm:odd:pr-6 sm:even:pl-6"
              >
                {item}
              </li>
            ))}
          </ul>
          {c.note && <ConceptNote>{c.note}</ConceptNote>}
        </Reveal>
      </div>
    </article>
  );
}

/* 7. Living world: image beside an example story chain */
function World() {
  const c = concepts.world;
  return (
    <article id={`concept-${c.slug}`} className="g6-rule py-16 lg:py-24">
      <div className="g6-wrap">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <p className="g6-tag">{c.kicker}</p>
            <div className="mt-5">
              <Title concept={c} />
            </div>
            <p className="g6-body mt-8 max-w-[50ch] text-lg">{c.summary}</p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {c.items.map((item) => (
                <li key={item} className="text-base text-[#f4efe8]">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-6">
            <div className="relative aspect-[5/4] overflow-hidden sm:aspect-[2/1] lg:aspect-[5/4]">
              <Image
                src={GTA6_IMAGES.livingWorld.src}
                alt={GTA6_IMAGES.livingWorld.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <p className="g6-mono mt-3 text-xs text-[#a39b90]">Promotional art, Rockstar Games</p>
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <p className="g6-mono mb-4 text-sm text-[#a39b90]">Example of one story lasting days</p>
          <ol className="grid gap-px overflow-hidden rounded-[6px] border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
            {worldChain.map((step, i) => (
              <li key={step} className="flex flex-col gap-6 bg-[#0a0a0a] p-5">
                <span className="g6-mono text-sm text-[#a39b90]">{String(i + 1).padStart(2, '0')}</span>
                <span className="g6-display g6-sm text-xl text-white">{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </article>
  );
}

export function Concepts() {
  return (
    <section id="concepts" aria-labelledby="g6-concepts-title" className="scroll-mt-28 pt-24 lg:pt-36">
      <div className="g6-wrap">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          <p className="g6-mono hidden pt-3 text-sm text-[#a39b90] lg:col-span-1 lg:block">04</p>
          <h2
            id="g6-concepts-title"
            className="g6-display text-[clamp(3rem,8vw,7.5rem)] text-white lg:col-span-11"
          >
            Roleplay concepts
          </h2>
          <p className="g6-body max-w-[58ch] text-lg lg:col-span-6 lg:col-start-2">
            Seven ideas we are exploring. They are proposals, not promises. What survives depends
            on what the tools can do and on what you tell us.
          </p>
        </div>
      </div>

      <div className="mt-20 lg:mt-28">
        <Business />
        <Economy />
        <Civilian />
        <Media />
        <Underworld />
        <Government />
        <World />
      </div>
    </section>
  );
}
