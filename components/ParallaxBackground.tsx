import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from './ThemeContext';

export const ParallaxBackground: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const { theme } = useTheme();

  // Create different movement speeds for parallax layers
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]); // Moves up slowly
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]); // Moves up medium
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -900]); // Moves up fast
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 200]);  // Moves down slowly
  const snowY = useTransform(scrollYProgress, [0, 1], [0, 600]); // Snow moves down relative to scroll

  // Christmas Lights Configuration
  const lights = Array.from({ length: 40 });

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700">
      {/* Deep Dark Base */}
      <div className="absolute inset-0 bg-dark-950"></div>

      {/* Global Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

      {/* Parallax Layer 1: Large Ambient Glows (Slow) */}
      <motion.div style={{ y: y1 }} className="absolute inset-0 transition-colors duration-700">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-vital-900/20 blur-[120px] rounded-full mix-blend-screen transition-colors duration-700"></div>
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-vital-800/10 blur-[120px] rounded-full mix-blend-screen transition-colors duration-700"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-vital-900/10 blur-[100px] rounded-full mix-blend-screen transition-colors duration-700"></div>
      </motion.div>

      {/* Parallax Layer 2: Medium Floating Orbs (Medium Speed) */}
      <motion.div style={{ y: y2 }} className="absolute inset-0 transition-colors duration-700">
         <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-vital-500/5 blur-[80px] rounded-full transition-colors duration-700"></div>
         <div className="absolute top-[60%] left-[10%] w-96 h-96 bg-vital-400/5 blur-[90px] rounded-full transition-colors duration-700"></div>
         <div className="absolute top-[85%] right-[20%] w-80 h-80 bg-vital-600/5 blur-[100px] rounded-full transition-colors duration-700"></div>
      </motion.div>

      {/* Parallax Layer 3: Small "Dust" Particles (Fast Speed) */}
      <motion.div style={{ y: y3 }} className="absolute inset-0">
        <div className="absolute top-[15%] left-[25%] w-2 h-2 bg-white/10 rounded-full blur-[1px]"></div>
        <div className="absolute top-[35%] right-[35%] w-1 h-1 bg-vital-500/20 rounded-full blur-[1px] transition-colors duration-700"></div>
        <div className="absolute top-[55%] left-[15%] w-3 h-3 bg-white/5 rounded-full blur-[2px]"></div>
        <div className="absolute top-[75%] right-[15%] w-2 h-2 bg-vital-400/10 rounded-full blur-[1px] transition-colors duration-700"></div>
        <div className="absolute top-[90%] left-[45%] w-1.5 h-1.5 bg-white/10 rounded-full blur-[1px]"></div>
      </motion.div>
      
      {/* Winter Theme Extras */}
      {theme === 'winter' && (
         <>
            {/* Ice Vignette */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.4 }}
               transition={{ duration: 1 }}
               className="absolute inset-0 z-20 mix-blend-overlay pointer-events-none"
               style={{
                  background: 'radial-gradient(circle at 50% 50%, transparent 40%, #22d3ee 120%)',
               }}
            />

            {/* Christmas Lights (Top decoration) */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute top-0 left-0 w-full h-12 z-30 flex justify-between items-start px-2 overflow-hidden pointer-events-none"
            >
                {/* Wire */}
                <svg className="absolute top-0 left-0 w-full h-10" preserveAspectRatio="none">
                    <path d="M0,0 Q50,20 100,0 T200,0 T300,0 T400,0 T500,0 T600,0 T700,0 T800,0 T900,0 T1000,0 T1100,0 T1200,0 T1300,0 T1400,0 T1500,0 T1600,0 T1700,0 T1800,0 T1900,0 T2000,0" 
                          fill="none" stroke="#4b5563" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>

                {lights.map((_, i) => {
                  const colors = ['bg-red-500', 'bg-green-500', 'bg-yellow-400', 'bg-blue-500', 'bg-purple-500'];
                  const color = colors[i % colors.length];
                  return (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ 
                          duration: 1 + Math.random(), 
                          repeat: Infinity, 
                          ease: "easeInOut",
                          delay: Math.random() * 2 
                      }}
                      className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_currentColor] mt-1 relative z-10`}
                      style={{ top: Math.sin(i) * 5 + 2 }} // Imperfect placement
                    />
                  );
                })}
            </motion.div>

            {/* Falling Snow */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 1 }}
               style={{ y: snowY }}
               className="absolute inset-0 z-10"
            >
               {[...Array(30)].map((_, i) => (
                   <motion.div
                       key={i}
                       animate={{
                           y: [0, 1000],
                           x: [0, Math.random() * 50 - 25],
                           rotate: [0, 360]
                       }}
                       transition={{
                           duration: 5 + Math.random() * 10,
                           repeat: Infinity,
                           ease: "linear",
                           delay: Math.random() * 10
                       }}
                       style={{
                           left: `${Math.random() * 100}%`,
                           top: `-${Math.random() * 20}%`
                       }}
                       className="absolute w-1.5 h-1.5 bg-white/60 rounded-full blur-[0.5px]"
                   />
               ))}
            </motion.div>
         </>
      )}

      {/* Parallax Layer 4: Counter-movement (Moves Down) */}
      <motion.div style={{ y: y4 }} className="absolute inset-0">
         <div className="absolute bottom-[30%] left-[-5%] w-[400px] h-[400px] bg-dark-900/80 blur-[80px] rounded-full"></div>
      </motion.div>
    </div>
  );
};