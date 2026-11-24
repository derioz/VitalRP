import React from 'react';
import Image from 'next/image';
import { DISCORD_URL, GTA6_IMAGES } from '@/lib/gta6/content';

export function Closing() {
  return (
    <section
      aria-labelledby="g6-closing-title"
      className="relative isolate flex min-h-[90svh] flex-col overflow-hidden border-t border-white/10"
    >
      <Image
        src={GTA6_IMAGES.closing.src}
        alt={GTA6_IMAGES.closing.alt}
        fill
        sizes="100vw"
        className="-z-10 object-cover object-[70%_50%]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0a0a0a]/50 via-transparent to-[#0a0a0a]/90" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0a0a]/85 via-[#0a0a0a]/45 to-transparent" />

      <div className="g6-wrap flex flex-1 flex-col pt-24 lg:pt-32">
        <div className="lg:w-[50%]">
          <h2
            id="g6-closing-title"
            className="g6-display text-[clamp(2.75rem,6.4vw,6.25rem)] text-white"
          >
            The Next Chapter of Vital Starts Here.
          </h2>
          <p className="mt-8 max-w-[44ch] text-lg leading-relaxed text-[#f4efe8]">
            Come to the Discord, read what we are thinking and tell us where we are wrong.
          </p>
          <div className="mt-10">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="g6-btn g6-btn-primary">
              Join Our Discord
            </a>
          </div>
        </div>

        <p className="g6-mono mt-auto max-w-[72ch] pb-8 pt-24 text-xs leading-relaxed text-[#d3cbc0]">
          Vital Roleplay is an unofficial community project and is not affiliated with, endorsed by
          or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto and related
          marks and promotional imagery belong to their respective owners.
        </p>
      </div>
    </section>
  );
}
