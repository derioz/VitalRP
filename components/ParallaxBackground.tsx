import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const ParallaxBackground: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const [isMobile, setIsMobile] = useState(true); // Default to true (safe) until hydration

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Performance Optimization: STATIC on mobile (no useTransform hooks active)
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -900]);

  // Mobile Static Background (No Framer Motion overhead)
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-dark-950">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] z-10"></div>
        {/* Static Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[100vw] h-[100vw] bg-vital-900/10 blur-[60px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[60%] right-[-10%] w-[80vw] h-[80vw] bg-vital-800/10 blur-[60px] rounded-full mix-blend-screen"></div>
        {/* Simple Static Stars */}
        <div className="absolute top-[20%] left-[20%] w-1 h-1 bg-white/20 rounded-full"></div>
        <div className="absolute top-[50%] right-[30%] w-1.5 h-1.5 bg-white/10 rounded-full"></div>
        <div className="absolute top-[80%] left-[10%] w-1 h-1 bg-white/20 rounded-full"></div>
      </div>
    );
  }

  // Desktop Dynamic Background
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700 bg-dark-950">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] z-10"></div>

      <motion.div style={{ y: y1 }} className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-vital-900/20 blur-[120px] rounded-full mix-blend-screen transition-colors duration-700"></div>
        <div className="absolute top-[60%] right-[-10%] w-[600px] h-[600px] bg-vital-800/10 blur-[120px] rounded-full mix-blend-screen transition-colors duration-700"></div>
      </motion.div>

      <motion.div style={{ y: y2 }} className="absolute inset-0">
         <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-vital-500/5 blur-[80px] rounded-full transition-colors duration-700"></div>
         <div className="absolute top-[60%] left-[10%] w-96 h-96 bg-vital-400/5 blur-[90px] rounded-full transition-colors duration-700"></div>
      </motion.div>

      <motion.div style={{ y: y3 }} className="absolute inset-0">
        <div className="absolute top-[15%] left-[25%] w-1.5 h-1.5 bg-white/10 rounded-full blur-[0.5px]"></div>
        <div className="absolute top-[35%] right-[35%] w-1 h-1 bg-vital-500/20 rounded-full transition-colors duration-700"></div>
        <div className="absolute top-[55%] left-[15%] w-2 h-2 bg-white/5 rounded-full blur-[1px]"></div>
        <div className="absolute top-[75%] right-[15%] w-2 h-2 bg-vital-400/10 rounded-full transition-colors duration-700"></div>
        <div className="absolute top-[90%] left-[45%] w-1 h-1 bg-white/10 rounded-full"></div>
      </motion.div>
    </div>
  );
};