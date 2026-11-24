'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GTA6_SECTIONS } from '@/lib/gta6/content';

/**
 * Secondary navigation. Appears once the hero is mostly scrolled past and
 * sits under the site header. Plain anchors, so it also works without JS.
 */
export function SectionNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>('overview');
  const stripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const els = GTA6_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el
    );
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.01, 0.5] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Keep the active link in view on small screens.
  useEffect(() => {
    const link = stripRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    link?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [active]);

  return (
    <nav
      aria-label="GTA VI sections"
      className={`fixed inset-x-0 top-14 z-40 border-b border-white/10 bg-[#0a0a0a] transition-[opacity,transform] duration-200 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div ref={stripRef} className="g6-strip g6-wrap flex gap-1 overflow-x-auto">
        {GTA6_SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              tabIndex={visible ? 0 : -1}
              aria-current={isActive ? 'true' : undefined}
              className={`relative flex h-11 shrink-0 items-center px-3 text-sm transition-colors ${
                isActive ? 'text-white' : 'text-[#a39b90] hover:text-white'
              }`}
            >
              {s.label}
              <span
                className={`absolute inset-x-3 bottom-0 h-px transition-opacity ${
                  isActive ? 'bg-[#f97316] opacity-100' : 'opacity-0'
                }`}
              />
            </a>
          );
        })}
      </div>
    </nav>
  );
}
