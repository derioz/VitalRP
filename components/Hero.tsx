'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// EXACT Unmodified Remote Asset & Social Constants
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

  // Fetch live CFX server population without polling overhead
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
        // Retain initial status on network error
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // -------------------------------------------------------------------------
  // ADVANCED 2026 SCROLL-LINKED PARALLAX ENGINE
  // Driven directly via compositor motion values tied to viewport scroll progress
  // -------------------------------------------------------------------------
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Layer 1: Background Artwork (~0.25x perceived scroll rate)
  // Progress 0% to 15%: Initial rest
  // Progress 15% to 45%: Parallax begins
  // Progress 45% to 75%: Scale and vertical offset increase
  // Progress 75% to 100%: Opacity subtly softens and subtle blur appears
  const bgScrollY = useTransform(scrollYProgress, [0, 0.15, 0.6, 1], [0, 0, 48, 85]);
  const bgScale = useTransform(scrollYProgress, [0, 0.15, 0.65, 1], [1.0, 1.0, 1.025, 1.05]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 1, 0.7]);
  const bgBlur = useTransform(
    scrollYProgress,
    [0, 0.75, 1],
    ['blur(0px)', 'blur(0px)', 'blur(3px)']
  );

  // Layer 2: Lighting & Gradient Overlay (~0.4x perceived rate)
  const overlayScrollY = useTransform(scrollYProgress, [0, 0.15, 0.6, 1], [0, 0, 22, 45]);
  const bottomGradientOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 0.8, 1],
    [0.75, 0.85, 0.95, 1]
  );
  const bottomGradientHeight = useTransform(
    scrollYProgress,
    [0, 0.6, 1],
    ['11rem', '13rem', '17rem']
  );

  // Layer 3: Hero Headline & Statements (~0.7x perceived rate)
  // Fades and translates upward smoothly without flying off the screen
  const headlineScrollY = useTransform(
    scrollYProgress,
    [0, 0.15, 0.55, 0.85],
    [0, 0, -45, -90]
  );
  const headlineOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.55, 0.8],
    [1, 1, 0.28, 0]
  );
  const headlineScale = useTransform(
    scrollYProgress,
    [0, 0.15, 0.7],
    [1, 1, 0.97]
  );
  const headlineLetterSpacing = useTransform(
    scrollYProgress,
    [0, 0.6],
    ['0em', '-0.015em']
  );

  // Layer 4: CTA & Server Information (~0.85x perceived rate)
  // Slightly stronger movement for genuine multiplane depth
  const ctaScrollY = useTransform(
    scrollYProgress,
    [0, 0.12, 0.5, 0.8],
    [0, 0, -60, -125]
  );
  const ctaOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.48, 0.72],
    [1, 1, 0.2, 0]
  );
  const ctaScale = useTransform(
    scrollYProgress,
    [0, 0.12, 0.65],
    [1, 1, 0.95]
  );

  // Scroll Indicator (Quickly fades out within first 12% scroll)
  const indicatorY = useTransform(scrollYProgress, [0, 0.12], [0, 16]);
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

  // Smooth scroll to next section
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
          opacity: prefersReducedMotion ? 1 : bgOpacity,
          filter: prefersReducedMotion ? 'blur(0px)' : bgBlur,
          transformStyle: 'preserve-3d',
        }}
        initial={
          prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.03 }
        }
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
      >
        <Image
          src={HERO_IMAGE}
          alt="Vital RP - Los Santos"
          fill
          priority
          unoptimized
          quality={90}
          sizes="100vw"
          className="object-cover object-[75%_center] lg:object-[80%_center] select-none"
        />
      </motion.div>

      {/* ------------------------------------------------------------------- */}
      {/* LAYER 2: LIGHTING & GRADIENT READABILITY OVERLAYS */}
      {/* ------------------------------------------------------------------- */}
      <motion.div
        style={{
          y: prefersReducedMotion ? 0 : overlayScrollY,
        }}
        className="absolute inset-0 pointer-events-none z-[1] will-change-transform"
      >
        {/* Left-to-right directional readability gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/70 via-35% md:via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 via-transparent to-transparent max-w-2xl" />

        {/* Soft top gradient for crisp navbar transparency */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-dark-950/85 via-dark-950/30 to-transparent" />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,5,5,0.45)_100%)]" />
      </motion.div>

      {/* Dynamic Bottom Transition Gradient (Smooth dissolve into next section) */}
      <motion.div
        style={{
          height: prefersReducedMotion ? '12rem' : bottomGradientHeight,
          opacity: prefersReducedMotion ? 0.85 : bottomGradientOpacity,
        }}
        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-transparent pointer-events-none z-[2] will-change-[height,opacity]"
      />

      {/* ------------------------------------------------------------------- */}
      {/* LAYER 3 & 4: FOREGROUND CONTENT (Multiplane Text & CTAs) */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 xl:px-20 pt-16 sm:pt-20">
        <div className="max-w-xl lg:max-w-2xl flex flex-col items-start text-left">
          {/* LAYER 3: HEADLINE & COPY CONTAINER */}
          <motion.div
            style={{
              x: fgOffsetX,
              y: prefersReducedMotion ? 0 : headlineScrollY,
              opacity: prefersReducedMotion ? 1 : headlineOpacity,
              scale: prefersReducedMotion ? 1 : headlineScale,
              letterSpacing: prefersReducedMotion ? '0em' : headlineLetterSpacing,
              transformStyle: 'preserve-3d',
              translateZ: prefersReducedMotion ? 0 : 25,
            }}
            className="w-full flex flex-col items-start will-change-transform"
          >
            {/* Eyebrow Accent */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="inline-flex items-center gap-3 mb-4 sm:mb-5"
            >
              <span className="w-7 sm:w-9 h-[2px] bg-vital-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <span className="text-xs sm:text-sm font-tech font-bold uppercase tracking-[0.25em] text-vital-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.45)]">
                SERIOUS ROLEPLAY. PLAYER-DRIVEN STORIES.
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
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-vital-400 via-vital-500 to-vital-600 drop-shadow-[0_0_35px_rgba(249,115,22,0.5)]">
                    RP
                  </span>
                </span>
              </h1>
            </motion.div>

            {/* Main Description */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
              className="text-lg sm:text-xl lg:text-[1.35rem] font-sans font-light text-gray-100 leading-snug tracking-wide mb-3 max-w-xl drop-shadow-md"
            >
              A serious roleplay community built around characters, stories, and the moments that make Los Santos feel alive.
            </motion.p>

            {/* Secondary Line */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
              className="text-sm sm:text-base font-sans text-gray-400 font-normal leading-relaxed mb-7 sm:mb-8 max-w-lg drop-shadow-sm"
            >
              Your choices matter. Your character has a story. What happens next is up to you.
            </motion.p>
          </motion.div>

          {/* LAYER 4: CTA & SERVER METADATA */}
          <motion.div
            style={{
              y: prefersReducedMotion ? 0 : ctaScrollY,
              opacity: prefersReducedMotion ? 1 : ctaOpacity,
              scale: prefersReducedMotion ? 1 : ctaScale,
            }}
            className="w-full flex flex-col items-start will-change-transform"
          >
            {/* Elegant Server Identity Line & Live Population Indicator */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' }}
              className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs font-tech tracking-wider text-gray-300 uppercase mb-8 sm:mb-9 py-2.5 border-y border-white/10 w-full sm:w-auto"
            >
              {/* Live CFX Population */}
              <div className="inline-flex items-center gap-2 text-white font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vital-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-vital-500 shadow-[0_0_8px_#f97316]" />
                </span>
                <span>
                  {serverStats.online && serverStats.players > 0
                    ? `${serverStats.players} Citizens in City`
                    : 'City Live'}
                </span>
              </div>

              <span className="text-white/25 select-none">•</span>
              <span className="text-gray-300">SERIOUS RP</span>
              <span className="text-white/25 select-none">•</span>
              <span className="text-gray-300">PLAYER DRIVEN</span>
              <span className="text-white/25 select-none">•</span>
              <span className="text-gray-300">STORY FOCUSED</span>
              <span className="text-white/25 select-none">•</span>
              <span className="text-gray-300">18+</span>
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
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-sm bg-gradient-to-r from-vital-500 to-vital-600 hover:brightness-110 text-white font-display font-black text-sm uppercase tracking-widest transition-[filter,box-shadow] duration-200 shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_35px_rgba(249,115,22,0.65)] cursor-pointer active:scale-[0.98]"
              >
                <span>Enter Los Santos</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1.5 stroke-[2.5]"
                />
              </button>

              {/* Secondary Action: Join the Community */}
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-sm bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/15 hover:border-vital-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] backdrop-blur-md font-display font-bold text-sm uppercase tracking-wider transition-colors duration-200 active:scale-[0.98]"
              >
                <DiscordIcon className="w-4 h-4 fill-current opacity-80 group-hover:opacity-100 transition-opacity text-vital-500" />
                <span>Join the Community</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* SCROLL INDICATOR (Fades within first 12% scroll) */}
      {/* ------------------------------------------------------------------- */}
      <motion.div
        style={{
          y: prefersReducedMotion ? 0 : indicatorY,
          opacity: prefersReducedMotion ? 1 : indicatorOpacity,
        }}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.85 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none select-none will-change-[transform,opacity]"
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
            className="w-full h-1/2 bg-vital-500 rounded-full shadow-[0_0_8px_#f97316]"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;