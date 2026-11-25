import React from 'react';
import Image from 'next/image';
import { GTA6_IMAGES, sectionNo, visionPoints } from '@/lib/gta6/content';
import { Reveal } from './Reveal';

export function Vision() {
  return (
    <section id="vision" aria-labelledby="g6-vision-title" className="g6-section pb-0 lg:pb-0">
      <div className="g6-wrap">
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
          <p className="g6-mono hidden pt-3 text-sm text-[#a39b90] lg:col-span-1 lg:block">{sectionNo('vision')}</p>

          <Reveal className="lg:col-span-11">
            <h2
              id="g6-vision-title"
              className="g6-display text-[clamp(3rem,8vw,7.5rem)] text-white"
            >
              Roleplay,
              <br className="hidden sm:block" /> Reimagined.
            </h2>
          </Reveal>

          <div className="lg:col-span-5 lg:col-start-2">
            <Reveal>
              <p className="max-w-[46ch] text-xl leading-relaxed text-[#f4efe8] sm:text-2xl">
                GTA VI gives Vital the chance to rethink what a roleplay server is for.
              </p>
              <p className="g6-body mt-6 max-w-[52ch] text-lg">
                We do not want to carry the GTA V server across and call it new. We want to build a
                place where businesses, communities, relationships and stories are shaped by the
                people playing in it. That means putting time into the parts of roleplay that last:
                who you work for, who you owe, who you answer to, and what people say about you.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={80}>
              <ul className="g6-list">
                {visionPoints.map((p) => (
                  <li key={p.label} className="g6-display g6-sm text-xl text-white sm:text-2xl">
                    {p.label}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>

      <figure className="relative mt-20 lg:mt-28">
        <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[2/1] lg:aspect-[5/2]">
          <Image
            src={GTA6_IMAGES.vision.src}
            alt={GTA6_IMAGES.vision.alt}
            fill
            sizes="100vw"
            className="object-cover object-[50%_40%]"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a0a]/70 to-transparent" />
          <figcaption className="g6-wrap g6-mono absolute inset-x-0 bottom-4 text-xs text-[#d3cbc0]">
            Promotional art, Rockstar Games
          </figcaption>
        </div>
      </figure>
    </section>
  );
}
