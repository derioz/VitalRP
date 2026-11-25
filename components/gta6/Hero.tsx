'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { DISCORD_URL, GTA6_IMAGES } from '@/lib/gta6/content';

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
        <Image
          src={GTA6_IMAGES.hero.src}
          alt={GTA6_IMAGES.hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_45%]"
        />
      </div>
      {/* Neutral darkening so text sits on calm sky and the base stays dark */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-transparent to-[#0a0a0a]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/65 via-black/30 to-transparent lg:via-black/20" />

      <div className="g6-wrap flex flex-1 flex-col pt-28 sm:pt-32 lg:pt-40">
        <p className="g6-tag g6-tag-live">Concept development</p>

        <h1
          id="g6-hero-title"
          className="g6-display mt-6 max-w-[14ch] text-[clamp(3.25rem,8vw,7.5rem)] text-white sm:max-w-[16ch]"
        >
          <span className="block">A New City.</span>
          <span className="block">A New Beginning.</span>
        </h1>

        <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-[#f4efe8] sm:text-xl">
          Vital Roleplay is planning its next chapter in Grand Theft Auto VI. Same commitment to
          characters and stories, in a new state and a new setting.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="g6-btn g6-btn-primary">
            Join Our Discord
          </a>
          <a href="#vision" className="g6-btn g6-btn-quiet">
            Explore Our Vision
          </a>
        </div>

        <div className="mt-auto flex items-end justify-between gap-6 pb-8 pt-16 sm:pb-10">
          <p className="g6-mono text-sm text-[#d3cbc0]">
            Vital Roleplay <span className="text-[#a39b90]">/</span> Grand Theft Auto VI
          </p>
          <a
            href="#vision"
            className="g6-mono hidden items-center gap-2 text-sm text-[#d3cbc0] transition-colors hover:text-white sm:inline-flex"
          >
            Scroll
            <ArrowDown size={16} strokeWidth={1.5} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
