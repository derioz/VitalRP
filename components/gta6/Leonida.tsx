'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { regions, sectionNo } from '@/lib/gta6/content';

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
      <div className="g6-wrap g6-section pb-10 lg:pb-12 lg:pt-16">
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12">
          <p className="g6-mono hidden pt-3 text-sm text-[#a39b90] lg:col-span-1 lg:block">{sectionNo('leonida')}</p>
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

      <div className="relative isolate overflow-hidden border-y border-white/10 lg:min-h-[640px]">
        {/* Stacked backgrounds, crossfaded with opacity only */}
        {regions.map((r, i) => (
          <div
            key={r.id}
            aria-hidden
            className="g6-photo absolute inset-0 -z-10"
            data-on={i === active}
          >
            <Image
              src={r.image.src}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[50%_55%]"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 via-[#0a0a0a]/20 to-[#0a0a0a]/60" />
            {/* Large screens: calm both text columns, leave the middle of the photograph open */}
            <div className="absolute inset-0 hidden bg-gradient-to-r from-[#0a0a0a]/70 via-transparent to-[#0a0a0a]/75 lg:block" />
          </div>
        ))}

        <div className="g6-wrap grid content-start gap-8 py-8 lg:grid-cols-12 lg:gap-10 lg:py-14">
          {/* Small screens wrap, so all six regions are visible at once */}
          <div
            role="tablist"
            aria-label="Regions of Leonida"
            onKeyDown={onKeyDown}
            className="flex flex-wrap gap-x-6 gap-y-1 lg:col-span-6 lg:flex-col lg:flex-nowrap lg:self-start"
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
                  className={`group flex min-h-[44px] items-baseline gap-2 py-1 text-left transition-colors [text-shadow:0_1px_12px_rgb(0_0_0/0.7)] lg:gap-4 ${
                    selected ? 'text-white' : 'text-white/75 hover:text-white'
                  }`}
                >
                  <span
                    className={`g6-mono text-sm lg:w-6 ${selected ? 'text-[#fdba74]' : 'text-[#e4ddd2]'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`g6-display text-[clamp(1.5rem,4.2vw,3.75rem)] ${
                      selected ? 'underline decoration-[#f97316] decoration-2 underline-offset-8' : ''
                    }`}
                  >
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
            className="flex flex-col [text-shadow:0_1px_12px_rgb(0_0_0/0.6)] lg:col-span-5 lg:col-start-8 lg:pt-2"
          >
            {/* Keyed by region so each selection plays its arrival */}
            <div key={region.id} className="g6-arrive">
              <p className="g6-tag">Concept</p>
              <p
                className="mt-4 text-xl leading-relaxed text-[#f4efe8] sm:text-2xl"
                style={{ '--i': 1 } as React.CSSProperties}
              >
                {region.summary}
              </p>
              <ul
                className="g6-list mt-8 grid gap-x-8 sm:grid-cols-2"
                style={{ '--i': 3 } as React.CSSProperties}
              >
                {region.themes.map((t) => (
                  <li key={t} className="text-base text-[#f4efe8]">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
