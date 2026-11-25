'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { getApiUrl } from '@/lib/api-config';

// EXACT Unmodified Remote Asset & Social Constants
const DISCORD_URL = 'https://discord.gg/vitalrp';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
  </svg>
);

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Nothing is shown until the server list has actually answered
  const [server, setServer] = useState<{
    state: 'pending' | 'unknown' | 'offline' | 'online';
    players: number;
  }>({ state: 'pending', players: 0 });

  // Fetch live CFX server population without polling overhead
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      let next: { state: 'unknown' | 'offline' | 'online'; players: number } = { state: 'unknown', players: 0 };
      try {
        const response = await fetch(getApiUrl('/api/cfx/population'));
        if (response.ok) {
          const data = await response.json();
          if (data?.status === 'online' || data?.status === 'offline') {
            next = { state: data.status, players: Number(data.players) || 0 };
          }
        }
      } catch {
        // Unknown: the status line is hidden
      }
      if (isMounted) setServer(next);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // The artwork drifts a little slower than the page. Text and buttons stay put
  // and fully visible for as long as they are on screen.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const bgScrollY = useTransform(scrollYProgress, [0, 0.15, 0.6, 1], [0, 0, 48, 85]);
  const bgScale = useTransform(scrollYProgress, [0, 0.15, 0.65, 1], [1.0, 1.0, 1.025, 1.05]);

  // The scroll cue leaves as soon as it has been followed
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  // -------------------------------------------------------------------------
  // DESKTOP POINTER PARALLAX (Subtle Micro-Displacement, Zero Re-renders)
  // Max X: ±8px, Max Y: ±5px, additive to scroll parallax
  // -------------------------------------------------------------------------
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const springConfig = { stiffness: 85, damping: 22, mass: 0.25 };
  const smoothMouseX = useSpring(rawMouseX, springConfig);
  const smoothMouseY = useSpring(rawMouseY, springConfig);

  // Background shifts subtly with pointer
  const bgTranslateX = useTransform(smoothMouseX, (val) => (prefersReducedMotion ? 0 : val));
  const bgCombinedY = useTransform(
    [bgScrollY, smoothMouseY],
    ([scrollYVal, mouseVal]) => (prefersReducedMotion ? 0 : Number(scrollYVal) + Number(mouseVal))
  );

  // Foreground layers counter-shift by ~2-3px for enhanced physical depth
  const fgOffsetX = useTransform(smoothMouseX, (val) => (prefersReducedMotion ? 0 : -val * 0.35));
  const fgOffsetY = useTransform(smoothMouseY, (val) => (prefersReducedMotion ? 0 : -val * 0.35));

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || e.pointerType === 'touch') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Normalized [-1 to +1]
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    rawMouseX.set(normX * 8);
    rawMouseY.set(normY * 5);
  };

  const handlePointerLeave = () => {
    rawMouseX.set(0);
    rawMouseY.set(0);
  };

  return (
    <section
      id="home"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-[100svh] min-h-[100svh] overflow-hidden flex items-center justify-start bg-dark-950 select-none"
      style={{ perspective: 1200 }}
    >
      {/* ------------------------------------------------------------------- */}
      {/* LAYER 1: BACKGROUND ARTWORK (Exact FiveManage Asset) */}
      {/* ------------------------------------------------------------------- */}
      <motion.div
        style={{
          x: bgTranslateX,
          y: bgCombinedY,
          scale: prefersReducedMotion ? 1 : bgScale,
          transformStyle: 'preserve-3d',
        }}
        initial={
          prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.03 }
        }
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
      >
        <picture>
          {/* Tall screens only ever show the right half, so they get just that */}
          <source media="(max-aspect-ratio: 4/5)" srcSet="/home/hero-tall.webp" />
          <img
            src="/home/hero-1600.webp"
            srcSet="/home/hero-960.webp 960w, /home/hero-1600.webp 1600w, /home/hero-2560.webp 2560w"
            sizes="max(100vw, 234vh)"
            alt="A police officer and a woman in sunglasses in front of a patrol car and the Los Santos skyline"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full select-none object-cover object-[80%_center] [@media(max-aspect-ratio:4/5)]:object-[50%_center] [@media(max-aspect-ratio:4/5)_and_(min-width:640px)]:object-[15%_center]"
          />
        </picture>
      </motion.div>

      {/* ------------------------------------------------------------------- */}
      {/* LAYER 2: LIGHTING & GRADIENT READABILITY OVERLAYS */}
      {/* ------------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        {/* Left-to-right directional readability gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/70 via-35% md:via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 via-transparent to-transparent max-w-2xl" />

        {/* Soft top gradient for crisp navbar transparency */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-dark-950/85 via-dark-950/30 to-transparent" />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,5,5,0.45)_100%)]" />
      </div>

      {/* Bottom dissolve into the next section */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-dark-950 via-dark-950/70 to-transparent opacity-85 pointer-events-none z-[2]" />

      {/* ------------------------------------------------------------------- */}
      {/* LAYER 3 & 4: FOREGROUND CONTENT (Multiplane Text & CTAs) */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="max-w-xl lg:max-w-2xl flex flex-col items-start text-left">
          {/* LAYER 3: HEADLINE & COPY CONTAINER */}
          <motion.div
            style={{ x: fgOffsetX, y: fgOffsetY }}
            className="w-full flex flex-col items-start will-change-transform"
          >
            {/* Main Headline */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE_OUT }}
              className="mb-5 sm:mb-6"
            >
              <h1 className="select-none text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-display font-black text-white leading-[0.9] tracking-tight">
                Vital <span className="text-vital-500">RP</span>
              </h1>
            </motion.div>

            {/* Main Description */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14, ease: EASE_OUT }}
              className="text-lg sm:text-xl lg:text-[1.35rem] font-sans text-gray-100 leading-snug mb-3 max-w-xl"
            >
              A serious roleplay community built around characters, stories, and the moments that make Los Santos feel alive.
            </motion.p>

            {/* Secondary Line */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
              className="text-base font-sans text-gray-300 leading-relaxed mb-7 sm:mb-8 max-w-lg"
            >
              Your choices matter. Your character has a story. What happens next is up to you.
            </motion.p>
          </motion.div>

          {/* LAYER 4: CTA & SERVER METADATA */}
          <div className="w-full flex flex-col items-start">
            {/* Live population */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.26, ease: EASE_OUT }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-tech tabular-nums text-gray-200 mb-8 sm:mb-9 py-2.5 border-y border-white/10 w-full sm:w-auto"
            >
              <span>Whitelisted</span>
              <span className="text-white/25 select-none">/</span>
              <span>18+</span>
              {/* Last in the row, so its arrival moves nothing. The space is held
                  while the answer is pending. */}
              {server.state !== 'unknown' && (
                <motion.span
                  key={server.state === 'pending' ? 'pending' : 'known'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: server.state === 'pending' ? 0 : 1 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  className="inline-flex min-h-5 basis-full items-center gap-2 text-white sm:basis-auto"
                >
                  {server.state !== 'pending' && (
                    <>
                      <span className="mr-1 hidden text-white/25 select-none sm:inline" aria-hidden="true">/</span>
                      <span className="relative flex h-2 w-2" aria-hidden="true">
                        {/* One ring when the answer lands: this figure is live */}
                        {server.state === 'online' && !prefersReducedMotion && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-vital-500"
                            initial={{ scale: 1, opacity: 0.8 }}
                            animate={{ scale: 3.2, opacity: 0 }}
                            transition={{ duration: 1.2, delay: 0.25, ease: 'easeOut' }}
                          />
                        )}
                        <span
                          className={`h-2 w-2 rounded-full ${server.state === 'online' ? 'bg-vital-500' : 'bg-gray-500'}`}
                        />
                      </span>
                      {server.state === 'offline'
                        ? 'Server offline'
                        : server.players > 0
                          ? `${server.players} ${server.players === 1 ? 'player' : 'players'} in the city`
                          : 'Server online'}
                    </>
                  )}
                </motion.span>
              )}
            </motion.div>

            {/* Minimalist CTAs */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3, ease: EASE_OUT }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto"
            >
              <Button
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                icon={<DiscordIcon className="w-5 h-5 fill-current" />}
              >
                Join the Discord
              </Button>
              <Button href="#how-to-join" variant="outline" size="lg" icon={<ArrowRight size={18} />}>
                How to get in
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* SCROLL INDICATOR (Fades within first 12% scroll) */}
      {/* ------------------------------------------------------------------- */}
      <motion.div
        style={{ opacity: prefersReducedMotion ? 1 : indicatorOpacity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 [@media(max-height:640px)]:hidden flex flex-col items-center gap-2 pointer-events-none select-none will-change-[transform,opacity]"
      >
        <span className="text-xs font-tech text-gray-300">
          Scroll
        </span>
        <div className="w-[1.5px] h-7 bg-white/15 overflow-hidden relative rounded-full">
          <motion.div
            animate={prefersReducedMotion ? {} : { y: ['-100%', '100%'] }}
            transition={{
              duration: 2.2,
              repeat: 2,
              ease: 'easeInOut',
            }}
            className="w-full h-1/2 bg-vital-500 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;