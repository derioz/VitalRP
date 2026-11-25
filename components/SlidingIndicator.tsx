'use client';

import React, { useEffect, useRef } from 'react';

/**
 * One underline that travels between choices, so the eye can follow where the
 * selection went. Place it inside a positioned parent that holds the choices.
 * It moves with transform only: the bar is 100px wide and scaled to fit.
 */
export function SlidingIndicator({
  selector,
  activeKey,
  inset = 0,
  className = '',
  base = 'g6-indicator',
}: {
  /** Matches the active choice inside the parent. */
  selector: string;
  /** Changes whenever the selection changes. */
  activeKey: string;
  /** Pixels trimmed from each side of the active choice. */
  inset?: number;
  className?: string;
  /** Positioning and travel styles. The default lives in gta6.css. */
  base?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const bar = ref.current;
    // A wrapper with display: contents has no box of its own, so step past it
    let host = bar?.parentElement ?? null;
    while (host && getComputedStyle(host).display === 'contents') host = host.parentElement;
    if (!bar || !host) return;
    let raf = 0;

    const place = () => {
      const target = host.querySelector<HTMLElement>(selector);
      if (!target) return;
      const width = target.offsetWidth - inset * 2;
      // Measured against the parent, whatever sits between it and the target
      const left = target.getBoundingClientRect().left - host.getBoundingClientRect().left + host.scrollLeft;
      bar.style.transform = `translateX(${left + inset}px) scaleX(${width / 100})`;
      bar.style.opacity = '1';
      // The first placement jumps into position; later ones travel.
      if (!bar.dataset.ready) {
        raf = requestAnimationFrame(() => {
          bar.dataset.ready = 'true';
        });
      }
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(host);
    document.fonts?.ready.then(place);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [selector, activeKey, inset]);

  return <span ref={ref} aria-hidden className={`${base} ${className}`} />;
}
