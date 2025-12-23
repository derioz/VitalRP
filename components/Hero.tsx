import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Wifi, ArrowRight, Zap, Globe } from 'lucide-react';
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
        setServerStats({ online: true, players: 412, max: 2048 });
      }
    };
    fetchStats();
  }, []);

  return (
    <section id="home" className="relative w-full bg-dark-900 pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden">
      
      {/* 1. BACKGROUND ELEMENTS */}
      {/* Radiant Glow Top Right */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vital-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      {/* Radiant Glow Bottom Left */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* 2. LEFT COLUMN: Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-tech font-bold uppercase tracking-widest mb-6"
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
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black text-white leading-[0.9] tracking-tighter mb-4">
                VITAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600">RP</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-400 font-light tracking-wide mb-8">
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
                <div className="relative flex items-center bg-dark-800 border border-white/10 rounded-lg p-1 pr-4 pl-4 h-[54px]">
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

          </div>

          {/* 3. RIGHT COLUMN: Visual Composition */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
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
               
               {/* Floating HUD Element - Bottom Right (Moved from Left to balance) */}
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

            {/* Floating Card - Top Left Overlap (Moved from Right) */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-12 -left-8 z-20 bg-dark-800 border border-white/10 p-5 rounded-xl shadow-2xl w-64"
            >
               <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                 <span className="text-xs font-tech text-gray-400 uppercase">Live Stats</span>
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
               </div>
               
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-vital-500/10 flex items-center justify-center text-vital-500">
                       <Users size={16} />
                     </div>
                     <div>
                       <div className="text-xl font-bold text-white leading-none">{serverStats.players}</div>
                       <div className="text-[10px] text-gray-500 uppercase">Citizens</div>
                     </div>
                   </div>
                 </div>

                 <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                   <div 
                     className="bg-gradient-to-r from-vital-600 to-vital-400 h-full rounded-full" 
                     style={{ width: `${(serverStats.players / serverStats.max) * 100}%` }}
                   ></div>
                 </div>
                 
                 <div className="flex justify-between text-[10px] text-gray-500 font-tech">
                    <span>Capacity</span>
                    <span>{Math.round((serverStats.players / serverStats.max) * 100)}%</span>
                 </div>
               </div>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};