'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { regions } from '@/lib/gta6/content';

/**
 * Regional showcase. The tab pattern follows the WAI-ARIA tabs practice
 * (arrow keys move between regions). The full-bleed crossfade layout is
 * inspired by the "Cinematic List" idea on 21st.dev, rebuilt here with
 * keyboard support and without animating layout properties.
 */
export function Leonida() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = regions.length - 1;
    let next = active;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = active === last ? 0 : active + 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const region = regions[active];

  return (
    <section id="leonida" aria-labelledby="g6-leonida-title" className="relative scroll-mt-28">
      <div className="g6-wrap g6-section pb-12 lg:pb-16">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          <p className="g6-mono hidden pt-3 text-sm text-[#a39b90] lg:col-span-1 lg:block">03</p>
          <h2
            id="g6-leonida-title"
            className="g6-display text-[clamp(3rem,8vw,7.5rem)] text-white lg:col-span-11"
          >
            Explore Leonida
          </h2>
          <p className="g6-body max-w-[56ch] text-lg lg:col-span-6 lg:col-start-2">
            Six places, six kinds of roleplay. Each description is what we would like to build
            there, not a claim about the official map.
          </p>
        </div>
      </div>

      <div className="relative isolate min-h-[760px] overflow-hidden border-y border-white/10 lg:min-h-[78svh]">
        {/* Stacked backgrounds, crossfaded with opacity only */}
        {regions.map((r, i) => (
          <div
            key={r.id}
            aria-hidden
            className={`absolute inset-0 -z-10 transition-opacity duration-700 ${
              i === active ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={r.image.src}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[50%_55%]"
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 via-transparent to-[#0a0a0a]/40" />
          </div>
        ))}

        <div className="g6-wrap grid min-h-[inherit] gap-10 py-10 lg:grid-cols-12 lg:py-16">
          <div
            role="tablist"
            aria-label="Regions of Leonida"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="g6-strip -mx-5 flex gap-6 overflow-x-auto px-5 lg:col-span-6 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0"
          >
            {regions.map((r, i) => {
              const selected = i === active;
              return (
                <button
                  key={r.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`g6-tab-${r.id}`}
                  aria-selected={selected}
                  aria-controls="g6-region-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`group flex shrink-0 items-baseline gap-4 text-left transition-colors ${
                    selected ? 'text-white' : 'text-white/50 hover:text-white/85'
                  }`}
                >
                  <span
                    className={`g6-mono w-6 text-sm ${selected ? 'text-[#f97316]' : 'text-[#a39b90]'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="g6-display whitespace-nowrap text-[clamp(1.75rem,4.2vw,3.75rem)] lg:whitespace-normal">
                    {r.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="g6-region-panel"
            aria-labelledby={`g6-tab-${region.id}`}
            className="flex flex-col justify-end lg:col-span-5 lg:col-start-8"
          >
            <p className="g6-tag">Concept</p>
            <p className="mt-4 text-xl leading-relaxed text-[#f4efe8] sm:text-2xl">{region.summary}</p>
            <ul className="g6-list mt-8 grid gap-x-8 sm:grid-cols-2">
              {region.themes.map((t) => (
                <li key={t} className="text-base text-[#f4efe8]">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
