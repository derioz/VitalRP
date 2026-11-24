import React from 'react';
import { communityWays, DISCORD_URL } from '@/lib/gta6/content';
import { Reveal } from './Reveal';

export function Community() {
  return (
    <section id="community" aria-labelledby="g6-community-title" className="g6-section g6-rule">
      <div className="g6-wrap grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <p className="g6-mono pb-6 text-sm text-[#a39b90]">05</p>
          <h2
            id="g6-community-title"
            className="g6-display text-[clamp(3rem,7vw,6.5rem)] text-white"
          >
            Help shape it
          </h2>
          <p className="g6-body mt-8 max-w-[46ch] text-lg">
            Nothing here is final, and the people who will play it should have a say. Everything
            happens in our Discord for now, so there is one place to find us.
          </p>
          <div className="mt-10">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="g6-btn g6-btn-primary">
              Join Our Discord
            </a>
          </div>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-5 lg:col-start-8 lg:pt-14">
          <ul className="g6-list">
            {communityWays.map((w, i) => (
              <li key={w} className="flex gap-5 text-lg text-[#f4efe8]">
                <span className="g6-mono w-6 pt-1 text-sm text-[#a39b90]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {w}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
