'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GTA6_SECTIONS } from '@/lib/gta6/content';
import { SlidingIndicator } from '../SlidingIndicator';

/**
 * Secondary navigation for the GTA VI section. It is the second row of the
 * site header: it shares the active GTA VI tab's surface, is centered on the
 * page, and is only rendered on /gta6.
 */
export function SectionNav() {
  const [active, setActive] = useState<string>('overview');
  const stripRef = useRef<HTMLDivElement | null>(null);

  // Active section = the last one whose top has passed 35% of the viewport.
  useEffect(() => {
    const els = GTA6_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el
    );
    let raf = 0;
    const update = () => {
      let current = els[0]?.id ?? 'overview';
      for (const el of els) {
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = el.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Keep the active link in view when the strip scrolls (small screens).
  useEffect(() => {
    const strip = stripRef.current;
    const link = strip?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!strip || !link) return;
    const left = link.offsetLeft - strip.clientWidth / 2 + link.clientWidth / 2;
    strip.scrollTo({ left, behavior: 'auto' });
  }, [active]);

  return (
    <nav
      aria-label="GTA VI sections"
      className="fixed inset-x-0 top-[57px] z-40 border-b border-white/10 bg-[#140e17]"
    >
      {/* Carries the dusk rule on small screens, where the main bar has no tab */}
      <span className="absolute left-0 top-0 h-0.5 w-24 bg-[linear-gradient(90deg,#d65f93,#f97316)] lg:hidden" />
      <div ref={stripRef} className="g6-strip overflow-x-auto">
        {/* w-max + mx-auto centers the links, and lets them scroll from the left when they overflow */}
        <div className="relative mx-auto flex h-11 w-max items-stretch gap-1 px-3 sm:px-5">
          {GTA6_SECTIONS.map((s) => {
            const isActive = active === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`relative flex shrink-0 items-center px-3 font-display text-sm font-medium transition-colors duration-150 ${
                  isActive ? 'text-white' : 'text-[#b4a9b9] hover:text-white'
                }`}
              >
                {s.label}
              </a>
            );
          })}
          <SlidingIndicator
            selector='a[aria-current="true"]'
            activeKey={active}
            inset={12}
            className="bottom-0 bg-[linear-gradient(90deg,#d65f93,#f97316)]"
          />
        </div>
      </div>
    </nav>
  );
}
