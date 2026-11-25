'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { DISCORD_URL, GTA6_IMAGES } from '@/lib/gta6/content';

/**
 * A poster: the city fills the screen, the headline is set to the width of the
 * page along its base, and everything else sits under one rule.
 */
export function Hero() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  // Subtle parallax on the photograph only. Skipped for reduced motion.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        if (layerRef.current) {
          layerRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="overview"
      aria-labelledby="g6-hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
    >
      <div ref={layerRef} className="absolute inset-x-0 -top-[4%] -z-10 h-[108%] will-change-transform">
        {/* Inner wrapper, so the entrance never fights the parallax transform */}
        <div className="g6-hero-photo absolute inset-0">
          <Image
            src={GTA6_IMAGES.hero.src}
            alt={GTA6_IMAGES.hero.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[44%_50%] sm:object-[50%_45%]"
          />
        </div>
      </div>
      {/* The sky and skyline stay open; the shade builds only where the type sits */}
      <div className="g6-hero-shade absolute inset-0 -z-10" />

      <div className="g6-wrap flex flex-1 flex-col justify-end pb-8 pt-28 sm:pb-12">
        <div className="g6-hero-measure">
          <h1 id="g6-hero-title" className="g6-display g6-hero-title text-white">
            <span className="g6-line">
              <span style={{ animationDelay: '180ms' }}>
                A New <br className="sm:hidden" />
                City.
              </span>
            </span>{' '}
            <span className="g6-line">
              <span style={{ animationDelay: '420ms' }}>
                A New <br className="sm:hidden" />
                Beginning.
              </span>
            </span>
          </h1>
        </div>

        <div
          className="g6-enter mt-4 grid gap-x-12 gap-y-5 border-t border-white/30 pt-4 sm:mt-6 sm:gap-y-6 sm:pt-5 md:grid-cols-[1fr_auto] md:items-end lg:mt-9 lg:pt-7"
          style={{ animationDelay: '620ms' }}
        >
          <div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <p className="g6-tag g6-tag-live">Concept development</p>
              <p className="g6-mono hidden text-[13px] text-[#d3cbc0] sm:block">
                Vital Roleplay <span className="text-[#a39b90]">/</span> Grand Theft Auto VI
              </p>
            </div>
            <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-[#f4efe8] sm:text-xl">
              Vital Roleplay is planning its next chapter in Grand Theft Auto VI. Same commitment to
              characters and stories, in a new state and a new setting.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:flex-nowrap [&>a]:flex-auto [&>a]:px-4 sm:[&>a]:px-6 md:[&>a]:flex-none">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="g6-btn g6-btn-primary">
              Join Our Discord
            </a>
            <a href="#vision" className="g6-btn g6-btn-quiet">
              Explore Our Vision
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
