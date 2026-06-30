import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Wifi, ArrowRight, Zap, Globe, Shield, Activity, Clock, Briefcase, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from './Button';



// -----------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------
const SERVER_IP = "cfx.re/join/ogpvmv";
const CONNECT_URL = "https://cfx.re/join/ogpvmv";
const CFX_SERVER_ID = 'ogpvmv';

export const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [serverStats, setServerStats] = useState({ online: false, players: 0, max: 2048 });
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [serverTime, setServerTime] = useState('08:00 AM');
  
  const { scrollY } = useScroll();

  // Simulate RP Time
  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date();
      // Fast forward time slightly for the "RP" feel
      let hours = (date.getHours() * 2) % 24;
      let minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const strMinutes = minutes < 10 ? '0' + minutes : minutes;
      setServerTime(`${hours}:${strMinutes} ${ampm}`);
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const triggerEasterEgg = () => {
    setEasterEggActive(true);
    
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f97316', '#10b981', '#3b82f6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f97316', '#10b981', '#3b82f6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(() => {
      setEasterEggActive(false);
    }, 4000);
  };

  // Parallax effects for Hero specifically
  const yText = useTransform(scrollY, [0, 300], [0, 100]);
  const yImage = useTransform(scrollY, [0, 300], [0, -50]);
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0]);

  const copyIp = () => {
    navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`https://frontend.cfx-services.net/api/servers/single/${CFX_SERVER_ID}`);
        if (!response.ok) throw new Error('Unreachable');
        const data = await response.json();
        if (data && data.Data) {
          setServerStats({ online: true, players: data.Data.clients, max: data.Data.sv_maxclients });
        }
      } catch (e) {
        // Server unreachable — show offline state
        setServerStats({ online: false, players: 0, max: 175 });
      }
    };
    fetchStats();
  }, []);

  // Simulated Stats
  const queueCount = serverStats.players > 1800 ? Math.floor(Math.random() * 20) + 5 : 0;

  return (
    <section id="home" className="relative w-full pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden">

      {/* Hero-specific localized glow (adds to the global parallax) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-vital-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 mix-blend-screen"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

          {/* 2. LEFT COLUMN: Content */}
          <motion.div
            style={{ y: yText, opacity: opacityHero }}
            className={`flex flex-col items-center lg:items-start text-center lg:text-left transition-all duration-300 ${easterEggActive ? 'hue-rotate-180 contrast-125' : ''}`}
          >

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-tech font-bold uppercase tracking-widest mb-6 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Accepting Applications
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black text-white leading-[0.9] tracking-tighter mb-4 drop-shadow-2xl">
                VITAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600 pr-3 pb-1">RP</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-400 font-light tracking-wide mb-8 lg:max-w-[90%]">
                Story-first roleplay, with a community that <span className="text-white font-medium">actually feels alive.</span>
              </p>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10"
            >
              Vital RP is built for immersive scenes, fair conflict, and the kind of RP you remember later. Win or lose, the goal is always the story.
            </motion.div>

            {/* Interactive Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
            >
              {/* Primary Connect Button */}
              <a href={CONNECT_URL} className="w-full sm:w-auto block">
                <Button size="lg" className="shadow-2xl shadow-vital-500/20 w-full">
                  <Zap size={20} className="mr-2 fill-current" />
                  Connect Now
                </Button>
              </a>

              {/* IP Copy Component */}
              <div className="relative group flex items-center">
                <div className="absolute inset-0 bg-white/5 rounded-lg blur-sm group-hover:bg-white/10 transition-all"></div>
                <div className="relative flex items-center bg-dark-800/80 backdrop-blur-md border border-white/10 rounded-lg p-1 pr-4 pl-4 h-[54px]">
                  <div className="flex flex-col items-start mr-8">
                    <span className="text-[10px] text-gray-500 font-tech uppercase tracking-wider">Server IP</span>
                    <span className="text-white font-tech font-bold">{SERVER_IP}</span>
                  </div>
                  <button
                    onClick={copyIp}
                    className="ml-auto p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Stats Row Mobile (Visible only on mobile) */}
            <div className="lg:hidden mt-8 flex items-center gap-6 border-t border-white/5 pt-6 w-full justify-center">
              <div className="flex flex-col items-center">
                <Users size={20} className="text-vital-500 mb-1" />
                <span className="font-bold text-white">{serverStats.players}</span>
                <span className="text-xs text-gray-500 font-tech uppercase">Online</span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex flex-col items-center">
                <Wifi size={20} className="text-green-500 mb-1" />
                <span className="font-bold text-white">12ms</span>
                <span className="text-xs text-gray-500 font-tech uppercase">Ping</span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex flex-col items-center">
                <Globe size={20} className="text-blue-500 mb-1" />
                <span className="font-bold text-white">US-East</span>
                <span className="text-xs text-gray-500 font-tech uppercase">Region</span>
              </div>
            </div>

            {/* Mobile Easter Egg Pill */}
            <div className="lg:hidden mt-6 w-full flex justify-center">
              <button 
                onClick={triggerEasterEgg}
                className="group/pill flex items-center gap-2 bg-dark-900/40 hover:bg-dark-900/80 backdrop-blur-md border border-white/10 p-1.5 pr-4 rounded-full transition-all duration-300 shadow-xl overflow-hidden"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-dark-800 flex-shrink-0 relative">
                  <motion.img 
                    animate={easterEggActive ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    src="/damon-icon.jpg" 
                    alt="Damon" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-vital-500/0 group-hover/pill:bg-vital-500/20 transition-colors"></div>
                </div>
                <span className="text-[10px] font-tech text-gray-400 group-hover/pill:text-white uppercase tracking-widest font-bold transition-colors">
                  Made by Damon
                </span>
              </button>
            </div>

          </motion.div>

          {/* 3. RIGHT COLUMN: Visual Composition */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ y: yImage }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Back Glow */}
            <div className="absolute inset-0 bg-vital-500/20 blur-[60px] rounded-full transform rotate-12 scale-75"></div>

            {/* Main Image Container with Tilt/3D effect */}
            <div className="relative z-10 w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent z-10 opacity-60"></div>
              <motion.img
                animate={easterEggActive ? { 
                  filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(270deg)', 'hue-rotate(0deg)'],
                  scale: [1, 1.05, 0.95, 1.1, 1]
                } : {}}
                transition={{ duration: 0.5, repeat: easterEggActive ? Infinity : 0 }}
                src="https://r2.fivemanage.com/image/nABguUthLZVW.png"
                alt="Vital RP City"
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
              />

              {/* Easter Egg Trigger Pill (Bottom Left) */}
              <button 
                onClick={triggerEasterEgg}
                className="absolute bottom-6 left-6 z-30 group/pill flex items-center gap-2 bg-dark-900/40 hover:bg-dark-900/80 backdrop-blur-md border border-white/10 p-1.5 pr-4 rounded-full transition-all duration-300 shadow-xl overflow-hidden"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-dark-800 flex-shrink-0 relative">
                  <motion.img 
                    animate={easterEggActive ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    src="/damon-icon.jpg" 
                    alt="Damon" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-vital-500/0 group-hover/pill:bg-vital-500/20 transition-colors"></div>
                </div>
                <span className="text-[10px] font-tech text-gray-400 group-hover/pill:text-white uppercase tracking-widest font-bold transition-colors">
                  Made by Damon
                </span>
              </button>

              {/* Floating HUD Element - Bottom Right */}
              <div className="absolute bottom-6 right-6 z-20">
                <div className="bg-dark-900/80 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-4 shadow-xl">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Wifi size={20} className="text-green-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-tech uppercase tracking-wider">Server Status</div>
                    <div className="text-white font-bold font-display">OPTIMAL PERFORMANCE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Floating Stats Panel - REDESIGNED */}
            <motion.div
              animate={easterEggActive ? { 
                x: [-10, 10, -10, 10, 0],
                y: [-10, 10, -10, 10, 0],
                filter: 'hue-rotate(90deg) contrast(200%)'
              } : { y: [0, -10, 0] }}
              transition={{ 
                repeat: easterEggActive ? Infinity : Infinity, 
                duration: easterEggActive ? 0.2 : 6, 
                ease: "easeInOut" 
              }}
              className="absolute -top-8 -right-12 z-30 w-80"
            >
              {/* Glassmorphic Container */}
              <div className="relative bg-dark-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                {/* Decorative Top Line */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${easterEggActive ? 'from-red-500 to-purple-500' : 'from-vital-500 to-transparent'}`}></div>

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className={easterEggActive ? 'text-red-500' : 'text-vital-500'} />
                    <span className={`text-xs font-bold font-tech tracking-widest uppercase ${easterEggActive ? 'text-red-500' : 'text-white'}`}>
                      {easterEggActive ? 'DAMON OVERRIDE' : 'CITY DASHBOARD'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-tech px-2 py-1 bg-white/5 rounded-md border border-white/5">
                    {serverTime}
                  </span>
                </div>

                {/* Main Stats */}
                <div className="px-5 py-4">
                  
                  {/* Population */}
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-tech block mb-1">Active Population</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-display font-black text-white tracking-tighter leading-none">{easterEggActive ? '9999' : serverStats.players}</span>
                        <span className="text-sm text-gray-600 font-tech font-bold">/{serverStats.max}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${serverStats.online ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${serverStats.online ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className="text-[9px] text-emerald-400 font-tech font-bold uppercase tracking-wider">{serverStats.online ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Faction / Economy Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-dark-800/50 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={12} className="text-blue-400" />
                        <span className="text-[9px] text-gray-400 uppercase font-tech tracking-wider">LSPD Units</span>
                      </div>
                      <div className="w-full bg-dark-950 rounded-full h-1.5 mb-1">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <div className="text-right text-[8px] text-gray-500 font-tech">12 ACTIVE</div>
                    </div>
                    
                    <div className="bg-dark-800/50 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={12} className="text-emerald-400" />
                        <span className="text-[9px] text-gray-400 uppercase font-tech tracking-wider">Economy</span>
                      </div>
                      <div className="w-full bg-dark-950 rounded-full h-1.5 mb-1">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <div className="text-right text-[8px] text-gray-500 font-tech">BOOMING</div>
                    </div>
                  </div>

                  {/* Threat Level */}
                  <div className="bg-gradient-to-r from-red-500/10 to-transparent border-l-2 border-red-500 rounded-r-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={16} className={easterEggActive ? 'text-red-500 animate-bounce' : 'text-red-500/80'} />
                      <div>
                        <div className="text-[9px] text-gray-400 uppercase font-tech tracking-wider">City Threat Level</div>
                        <div className={`text-xs font-bold font-tech uppercase ${easterEggActive ? 'text-red-500 animate-pulse' : 'text-red-400'}`}>
                          {easterEggActive ? 'CRITICAL OVERRIDE' : 'ELEVATED - MODERATE'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};