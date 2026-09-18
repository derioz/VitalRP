'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Brand & Server Constants
const HERO_IMAGE = 'https://r2.fivemanage.com/image/T0Q31BrvyOVQ.png';
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

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const [serverStats, setServerStats] = useState<{
    online: boolean;
    players: number;
  }>({
    online: false,
    players: 0,
  });

  // Query live CFX server population
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/cfx/population');
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data) {
          setServerStats({
            online: Boolean(data.online),
            players: Number(data.players) || 0,
          });
        }
      } catch {
        // CFX unreachable or offline - maintain default state
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Scroll Parallax Controls
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Background Parallax: moves slightly slower than scroll and scales subtly
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  // Foreground Copy Parallax: gentle upward drift and smooth fade between 20% and 60%
  const textY = useTransform(scrollYProgress, [0, 0.6], [0, -50]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2, 0.6], [1, 1, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.98]);

  // Scroll Indicator Fade: quickly fades within the first 12% of scroll
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  // Smooth scroll handler for Enter Los Santos
  const handleEnterLosSantos = () => {
    const target =
      document.getElementById('features-slot') ||
      document.getElementById('features');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = 'features';
    }
  };

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative w-full h-[100svh] min-h-[100svh] overflow-hidden flex items-center justify-start bg-dark-950"
    >
      {/* 1. CINEMATIC BACKGROUND IMAGE WITH PARALLAX */}
      <motion.div
        style={{
          y: prefersReducedMotion ? 0 : bgY,
          scale: prefersReducedMotion ? 1 : bgScale,
        }}
        initial={
          prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.03 }
        }
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <Image
          src={HERO_IMAGE}
          alt="Vital RP - Los Santos"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[75%_center] lg:object-[80%_center] select-none"
        />
      </motion.div>

      {/* 2. LAYERED CINEMATIC LIGHTING OVERLAYS */}
      {/* Left-to-right gradient: ensures maximum text contrast on the left without dulling the right artwork */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/70 via-35% md:via-45% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 via-transparent to-transparent max-w-2xl pointer-events-none z-[1]" />

      {/* Top gradient: subtle soft shadow for floating navbar readability */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-dark-950/80 via-dark-950/25 to-transparent pointer-events-none z-[2]" />

      {/* Bottom transition gradient: seamless melt into the next homepage section */}
      <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent pointer-events-none z-[2]" />

      {/* Optional subtle cinematic vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,5,5,0.45)_100%)] pointer-events-none z-[2]" />

      {/* 3. HERO CONTENT - LEFT ALIGNED & VISUALLY DOMINANT */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 xl:px-20 pt-16 sm:pt-20">
        <motion.div
          style={{
            y: prefersReducedMotion ? 0 : textY,
            opacity: prefersReducedMotion ? 1 : textOpacity,
            scale: prefersReducedMotion ? 1 : textScale,
          }}
          className="max-w-xl lg:max-w-2xl flex flex-col items-start text-left"
        >
          {/* Eyebrow Accent */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="inline-flex items-center gap-3 mb-4 sm:mb-5"
          >
            <span className="w-7 sm:w-9 h-[2px] bg-[#faa200]" />
            <span className="text-xs sm:text-sm font-tech font-bold uppercase tracking-[0.25em] text-[#faa200] drop-shadow-[0_0_12px_rgba(250,162,0,0.4)]">
              WELCOME TO LOS SANTOS
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: 'easeOut' }}
            className="mb-5 sm:mb-6"
          >
            <h1 className="flex flex-col tracking-tight select-none">
              <span className="text-xl sm:text-2xl md:text-3xl font-display font-medium text-gray-300 uppercase tracking-[0.16em] mb-1 drop-shadow-sm">
                WE ARE
              </span>
              <span className="text-5xl sm:text-7xl md:text-8xl lg:text-[5.75rem] font-display font-black text-white uppercase leading-[0.88] tracking-tight drop-shadow-[0_10px_35px_rgba(0,0,0,0.85)]">
                VITAL{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#faa200] via-[#faa200] to-orange-500 drop-shadow-[0_0_35px_rgba(250,162,0,0.4)]">
                  RP
                </span>
              </span>
            </h1>
          </motion.div>

          {/* Strong Identity Statement */}
          <motion.p
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
            className="text-lg sm:text-xl lg:text-[1.35rem] font-sans font-light text-gray-100 leading-snug tracking-wide mb-3 max-w-xl drop-shadow-md"
          >
            More than a server. A city built around stories, characters, and the people who bring them to life.
          </motion.p>

          {/* Supporting Line */}
          <motion.p
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
            className="text-sm sm:text-base font-sans text-gray-400 font-normal leading-relaxed mb-7 sm:mb-8 max-w-lg drop-shadow-sm"
          >
            Serious roleplay. Player-driven stories. A community where what you do actually matters.
          </motion.p>

          {/* Elegant Server Information & Live Population Line */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs font-tech tracking-wider text-gray-300 uppercase mb-8 sm:mb-9 py-2.5 border-y border-white/10 w-full sm:w-auto"
          >
            {/* Live CFX Population */}
            <div className="inline-flex items-center gap-2 text-white font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#faa200] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#faa200]" />
              </span>
              <span>
                {serverStats.online
                  ? `${serverStats.players} players in Los Santos`
                  : 'Los Santos Online'}
              </span>
            </div>

            <span className="text-white/25 select-none">•</span>
            <span className="text-gray-300">Serious RP</span>
            <span className="text-white/25 select-none">•</span>
            <span className="text-gray-300">Player Driven</span>
            <span className="text-white/25 select-none">•</span>
            <span className="text-gray-300">Custom Experience</span>
          </motion.div>

          {/* Minimalist CTAs */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto"
          >
            {/* Primary Action: Enter Los Santos */}
            <button
              onClick={handleEnterLosSantos}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-sm bg-[#faa200] hover:bg-[#ffb020] text-dark-950 font-display font-black text-sm uppercase tracking-widest transition-all duration-200 shadow-[0_0_25px_rgba(250,162,0,0.3)] hover:shadow-[0_0_35px_rgba(250,162,0,0.55)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Enter Los Santos</span>
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-1 stroke-[2.5]"
              />
            </button>

            {/* Secondary Action: Join Discord */}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-sm bg-white/[0.04] hover:bg-white/[0.09] text-white border border-white/15 hover:border-white/35 backdrop-blur-md font-display font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <DiscordIcon className="w-4 h-4 fill-current opacity-80 group-hover:opacity-100 transition-opacity" />
              <span>Join Discord</span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* 4. REFINED BOTTOM SCROLL INDICATOR */}
      <motion.div
        style={{ opacity: prefersReducedMotion ? 1 : indicatorOpacity }}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.85 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none select-none"
      >
        <span className="text-[10px] font-tech uppercase tracking-[0.3em] text-gray-400 font-medium">
          SCROLL
        </span>
        <div className="w-[1.5px] h-7 bg-white/15 overflow-hidden relative rounded-full">
          <motion.div
            animate={prefersReducedMotion ? {} : { y: ['-100%', '100%'] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-1/2 bg-[#faa200] rounded-full shadow-[0_0_8px_#faa200]"
          />
        </div>
      </motion.div>
    </section>
  );
};
export default Hero;