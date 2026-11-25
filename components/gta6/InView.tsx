'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Marks an element when it scrolls into view so CSS can play its one motion.
 * Content is visible by default (no JS, SSR). `data-armed` is only set after
 * hydration for elements below the fold, and never under reduced motion.
 */
export function InView({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'ol' | 'ul';
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;

    el.dataset.armed = 'true';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.in = 'true';
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}
