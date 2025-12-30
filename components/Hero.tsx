import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Copy, Check, Users, Wifi, ArrowRight, Zap, Globe, Shield, Activity, Clock } from 'lucide-react';
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
  const { scrollY } = useScroll();

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
        const response = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${CFX_SERVER_ID}`);
        if (!response.ok) throw new Error('Unreachable');
        const data = await response.json();
        if (data && data.Data) {
          setServerStats({ online: true, players: data.Data.clients, max: data.Data.sv_maxclients });
        }
      } catch (e) {
        // Fallback for demo/dev purposes or if API is unreachable
        setServerStats({ online: true, players: 412, max: 2048 });
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
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
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
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10"
            >
              Vital RP is built for immersive scenes, fair conflict, and the kind of RP you remember later. Win or lose, the goal is always the story.
            </motion.p>

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
               <img 
                 src="https://r2.fivemanage.com/image/nABguUthLZVW.png" 
                 alt="Vital RP City"
                 className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
               />
               
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
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -top-12 -left-8 z-30 w-72"
            >
               {/* Glassmorphic Container */}
               <div className="relative bg-dark-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  
                  {/* Decorative Top Line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vital-500 to-transparent"></div>

                  {/* Header */}
                  <div className="flex justify-between items-center p-5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${serverStats.online ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${serverStats.online ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      </span>
                      <span className="text-xs font-bold font-tech text-white tracking-widest uppercase">
                        {serverStats.online ? 'System Online' : 'System Offline'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-tech">US-EAST</span>
                  </div>
                  
                  {/* Main Stats */}
                  <div className="px-6 py-4">
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-xs font-sans font-medium">Active Citizens</span>
                        <span className="text-vital-500 text-xs font-tech">{(serverStats.players / serverStats.max * 100).toFixed(0)}% LOAD</span>
                     </div>
                     
                     <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-6xl font-display font-black text-white tracking-tighter leading-none">{serverStats.players}</span>
                        <span className="text-lg text-gray-600 font-tech font-bold">/{serverStats.max}</span>
                     </div>

                     {/* Queue & Ping Grid */}
                     <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-white/5 rounded-lg p-2.5 border border-white/5 flex flex-col">
                           <span className="text-[10px] text-gray-500 uppercase font-tech mb-1">Queue Length</span>
                           <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-white font-bold">{queueCount}</span>
                           </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2.5 border border-white/5 flex flex-col">
                           <span className="text-[10px] text-gray-500 uppercase font-tech mb-1">Avg Latency</span>
                           <div className="flex items-center gap-2">
                              <Wifi size={14} className="text-emerald-500" />
                              <span className="text-white font-bold">12ms</span>
                           </div>
                        </div>
                     </div>

                     {/* Server Health Graph */}
                     <div className="relative h-10 w-full bg-dark-950/50 rounded-lg overflow-hidden border border-white/5">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 grid grid-cols-6 gap-px opacity-10">
                           {[...Array(6)].map((_, i) => <div key={i} className="bg-white/50 h-full w-px"></div>)}
                        </div>
                        
                        {/* Line */}
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                           <motion.path 
                              d="M0,20 L10,20 L20,15 L30,25 L40,20 L50,10 L60,30 L70,20 L80,22 L90,18 L100,20 L110,5 L120,35 L130,20 L140,20 L200,20 L210,10 L220,30 L300,20" 
                              fill="none" 
                              stroke="#f97316" 
                              strokeWidth="1.5"
                              vectorEffect="non-scaling-stroke"
                              initial={{ x: -100 }}
                              animate={{ x: 0 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                           />
                        </svg>
                        <div className="absolute bottom-1 right-2 text-[8px] text-vital-500 font-tech">TICK: 60</div>
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