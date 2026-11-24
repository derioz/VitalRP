import React from 'react';
import { principles } from '@/lib/gta6/content';
import { Reveal } from './Reveal';

/**
 * Light "paper" section. Breaks the dark run and gives the six principles a
 * different register from everything around them.
 */
export function Principles() {
  return (
    <section aria-labelledby="g6-principles-title" className="g6-paper g6-section">
      <div className="g6-wrap grid gap-x-12 gap-y-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-40">
            <h2
              id="g6-principles-title"
              className="g6-display text-[clamp(2.75rem,5.5vw,5rem)]"
            >
              Six principles
            </h2>
            <p className="g6-paper-body mt-6 max-w-[34ch] text-lg">
              These decide what we build and what we leave out. When a feature fights one of them,
              the feature loses.
            </p>
          </div>
        </div>

        <ol className="lg:col-span-8">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.title} className="group g6-paper-rule py-8 last:border-b sm:py-10">
              <div className="grid gap-4 sm:grid-cols-[64px_1fr] sm:gap-8">
                <span className="g6-mono g6-paper-accent pt-2 text-sm">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="grid gap-4 md:grid-cols-2 md:gap-10">
                  <h3 className="g6-display g6-sm text-[clamp(1.875rem,3.4vw,3rem)]">{p.title}</h3>
                  <p className="g6-paper-body max-w-[42ch] text-lg md:pt-2">{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
