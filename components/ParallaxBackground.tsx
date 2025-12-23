import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const ParallaxBackground: React.FC = () => {
  const { scrollYProgress } = useScroll();

  // Create different movement speeds for parallax layers
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]); // Moves up slowly
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]); // Moves up medium
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -900]); // Moves up fast
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 200]);  // Moves down slowly

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep Dark Base */}
      <div className="absolute inset-0 bg-dark-950"></div>

      {/* Global Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

      {/* Parallax Layer 1: Large Ambient Glows (Slow) */}
      <motion.div style={{ y: y1 }} className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-vital-900/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-vital-900/10 blur-[100px] rounded-full mix-blend-screen"></div>
      </motion.div>

      {/* Parallax Layer 2: Medium Floating Orbs (Medium Speed) */}
      <motion.div style={{ y: y2 }} className="absolute inset-0">
         <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-vital-500/5 blur-[80px] rounded-full"></div>
         <div className="absolute top-[60%] left-[10%] w-96 h-96 bg-orange-500/5 blur-[90px] rounded-full"></div>
         <div className="absolute top-[85%] right-[20%] w-80 h-80 bg-red-500/5 blur-[100px] rounded-full"></div>
      </motion.div>

      {/* Parallax Layer 3: Small "Dust" Particles (Fast Speed) */}
      <motion.div style={{ y: y3 }} className="absolute inset-0">
        <div className="absolute top-[15%] left-[25%] w-2 h-2 bg-white/10 rounded-full blur-[1px]"></div>
        <div className="absolute top-[35%] right-[35%] w-1 h-1 bg-vital-500/20 rounded-full blur-[1px]"></div>
        <div className="absolute top-[55%] left-[15%] w-3 h-3 bg-white/5 rounded-full blur-[2px]"></div>
        <div className="absolute top-[75%] right-[15%] w-2 h-2 bg-vital-400/10 rounded-full blur-[1px]"></div>
        <div className="absolute top-[90%] left-[45%] w-1.5 h-1.5 bg-blue-400/10 rounded-full blur-[1px]"></div>
      </motion.div>

      {/* Parallax Layer 4: Counter-movement (Moves Down) */}
      <motion.div style={{ y: y4 }} className="absolute inset-0">
         <div className="absolute bottom-[30%] left-[-5%] w-[400px] h-[400px] bg-dark-900/80 blur-[80px] rounded-full"></div>
      </motion.div>
    </div>
  );
};