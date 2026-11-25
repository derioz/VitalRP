'use client';

import React from 'react';
import { Button } from './Button';
import { Gamepad2 } from 'lucide-react';
import './Poster.css';

const DiscordLogo = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    className={className}
  >
    <title>Discord</title>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
  </svg>
);

/* On orange the usual orange button and focus ring disappear, so both turn dark */
const ON_ORANGE = 'w-full sm:w-auto !px-4 sm:!px-8 focus-visible:!outline-dark-950';

export const JoinCTA: React.FC = () => {
  return (
    <section id="join" aria-labelledby="join-title" className="finale relative scroll-mt-14 overflow-hidden bg-vital-600 text-dark-950">
      <div className="finale-body relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center px-4 pt-20 sm:px-6 lg:px-8 lg:py-20">
        <h2 id="join-title" className="poster-title finale-title font-display font-black">
          <span className="block whitespace-nowrap">Ready to </span>
          <span className="block whitespace-nowrap">start your </span>
          <span className="block whitespace-nowrap text-white">legacy?</span>
        </h2>
        <p className="mt-6 max-w-sm text-lg font-sans font-medium leading-relaxed md:text-xl">
          Join the Discord, apply in the whitelist channel, then step into Los Santos.
        </p>

        <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center lg:w-fit lg:flex-col lg:items-stretch">
          <Button href="https://discord.gg/vitalrp" target="_blank" rel="noopener noreferrer" variant="secondary" size="lg" className={ON_ORANGE} icon={<DiscordLogo className="w-6 h-6" />}>
            Join the Discord
          </Button>

          <Button href="https://connect.vitalrp.net" target="_blank" rel="noopener noreferrer" variant="ghost" size="lg" className={`${ON_ORANGE} !border-dark-950 !text-dark-950 hover:!bg-dark-950/10`} icon={<Gamepad2 />}>
            Already whitelisted? Connect
          </Button>
        </div>
      </div>

      <img
        src="/home/finale-1220.webp"
        srcSet="/home/finale-780.webp 780w, /home/finale-1220.webp 1220w"
        sizes="(min-width: 1024px) min(58vw, 60rem), min(100vw, 40rem)"
        width={1220}
        height={800}
        loading="lazy"
        decoding="async"
        alt=""
        className="finale-art pointer-events-none select-none"
      />
    </section>
  );
};
