'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowDown, Pause, Play, RotateCcw } from 'lucide-react';
import { supplyChain } from '@/lib/gta6/content';
import { InView } from './InView';

/** Time each player holds the dinner during a walk-through, long enough to read. */
const DWELL = 4500;
/** Gap between neighbouring segments when the line catches up with a jump. */
const STEP_DELAY = 90;

/**
 * Interactive example: one meal, five players.
 *
 * The line along the chain shows how far the dinner has travelled. On first
 * view a light runs once along it to show the direction. "Follow the dinner"
 * hands it from player to player; any manual choice takes over again.
 */
export function SupplyChain() {
  const [{ active, previous }, setStep] = useState({ active: 0, previous: 0 });
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const last = supplyChain.length - 1;

  const go = (next: number) => setStep((s) => ({ active: next, previous: s.active }));

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (active < last) go(active + 1);
      else setPlaying(false);
    }, DWELL);
    return () => window.clearTimeout(timer);
  }, [playing, active, last]);

  // Never run unseen: pause when scrolled away or when the tab is hidden.
  useEffect(() => {
    const root = rootRef.current;
    if (!playing || !root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false);
    });
    observer.observe(root);
    const onHidden = () => document.hidden && setPlaying(false);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [playing]);

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (active === last) go(0);
    setPlaying(true);
  };

  const finished = !playing && active === last;
  const Icon = playing ? Pause : finished ? RotateCcw : Play;

  return (
    <div ref={rootRef}>
      <InView className="g6-chain">
        {/* Five columns need about 1280px before the longest role names fit */}
        <ol className="grid gap-px overflow-hidden rounded-[6px] border border-white/10 bg-white/10 xl:grid-cols-5">
          {supplyChain.map((s, i) => {
            const selected = i === active;
            const reached = i <= active;
            const delay = reached
              ? Math.max(0, i - previous - 1) * STEP_DELAY
              : Math.max(0, previous - i) * STEP_DELAY;
            return (
              <li
                key={s.role}
                className="relative bg-[#0a0a0a]"
                style={{ '--i': i } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    go(i);
                  }}
                  aria-pressed={selected}
                  className={`flex h-full w-full items-baseline gap-4 py-4 pl-5 pr-12 text-left transition-colors duration-300 xl:min-h-[140px] xl:flex-col xl:items-start xl:gap-6 xl:p-5 ${
                    selected ? 'bg-[#1a1613]' : 'hover:bg-[#141211]'
                  }`}
                >
                  <span
                    className={`g6-mono text-sm transition-colors duration-300 ${
                      selected ? 'text-[#f97316]' : 'text-[#a39b90]'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="g6-display g6-sm text-xl text-white xl:text-2xl">{s.role}</span>
                </button>

                <span aria-hidden className="g6-chain-track">
                  <span
                    className="g6-chain-fill"
                    data-on={reached}
                    data-timing={playing && selected}
                    style={{
                      transitionDelay: `${delay}ms`,
                      animationDuration: `${DWELL}ms`,
                    }}
                  />
                  <span className="g6-chain-pass" />
                </span>

                {i < last && (
                  <>
                    <ArrowRight
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden
                      className="absolute right-3 top-5 z-10 hidden text-[#a39b90] xl:block"
                    />
                    <ArrowDown
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden
                      className="absolute right-5 top-5 z-10 text-[#a39b90] xl:hidden"
                    />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </InView>

      <div className="mt-px border border-t-0 border-white/10 p-6 sm:p-8">
        {/* All five share one cell, so the box keeps the tallest height and nothing below jumps */}
        <div className="grid" aria-live="polite">
          {supplyChain.map((s, i) => (
            <div
              key={s.role}
              className={`col-start-1 row-start-1 grid content-start gap-8 sm:grid-cols-2 ${
                i === active ? 'g6-arrive visible' : 'invisible'
              }`}
            >
              <div>
                <p className="g6-mono text-sm text-[#a39b90]">What the {s.role.toLowerCase()} does</p>
                <p className="mt-3 text-lg leading-relaxed text-[#f4efe8]">{s.does}</p>
              </div>
              <div style={{ '--i': 2 } as React.CSSProperties}>
                <p className="g6-mono text-sm text-[#a39b90]">Roleplay it creates</p>
                <p className="mt-3 text-lg leading-relaxed text-[#f4efe8]">{s.roleplay}</p>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={toggle} className="g6-btn g6-btn-quiet mt-8">
          <Icon size={16} strokeWidth={1.5} aria-hidden />
          {playing ? 'Pause' : finished ? 'Follow it again' : 'Follow the dinner'}
        </button>
      </div>
    </div>
  );
}
