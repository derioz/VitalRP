import React from 'react';
import { roadmap } from '@/lib/gta6/content';
import { Reveal } from './Reveal';

export function Roadmap() {
  return (
    <section id="roadmap" aria-labelledby="g6-roadmap-title" className="g6-section g6-rule mt-0">
      <div className="g6-wrap">
        <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-12">
          <h2
            id="g6-roadmap-title"
            className="g6-display text-[clamp(2.75rem,5.5vw,5rem)] text-white lg:col-span-5"
          >
            <span className="g6-mono mr-5 inline-block w-6 align-baseline text-sm text-[#a39b90]">05</span><span>Roadmap</span>
          </h2>
          <p className="g6-body max-w-[56ch] text-lg lg:col-span-6 lg:col-start-7">
            Five phases, in order. We have no dates to give, so there are none here. A phase gets
            marked as done when it is.
          </p>
        </div>

        <ol className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-5 lg:gap-0">
          {roadmap.map((p) => {
            const current = p.status === 'current';
            return (
              <Reveal as="li" key={p.number} className="relative lg:pr-8">
                <div
                  className={`mb-6 hidden h-px lg:block ${current ? 'bg-[#f97316]' : 'bg-white/15'}`}
                />
                <div className="flex items-baseline gap-4 lg:block">
                  <span className={`g6-mono text-sm ${current ? 'text-[#f97316]' : 'text-[#a39b90]'}`}>
                    {p.number}
                  </span>
                  <h3
                    className={`g6-display g6-sm text-3xl lg:mt-4 ${current ? 'text-white' : 'text-white/60'}`}
                  >
                    {p.title}
                  </h3>
                </div>
                <p className={`g6-tag mt-4 ${current ? 'g6-tag-live' : ''}`}>
                  {current ? 'Current phase' : 'Upcoming'}
                </p>
                <p className={`mt-4 max-w-[30ch] leading-relaxed ${current ? 'text-[#f4efe8]' : 'text-[#a39b90]'}`}>
                  {p.body}
                </p>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
