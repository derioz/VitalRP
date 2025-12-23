import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Values } from './components/Values';
import { Staff } from './components/Staff';
import { Gallery } from './components/Gallery';
import { Rules } from './components/Rules';
import { FAQ } from './components/FAQ';
import { JoinCTA } from './components/JoinCTA';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-vital-500 selection:text-white">
      {/* Horizontal Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-vital-500 to-vital-400 origin-left z-[100]"
        style={{ scaleX }}
      />

      <Navbar />
      <main>
        <Hero />
        <Features />
        <Values />
        <Staff />
        <Gallery />
        <Rules />
        <FAQ />
        <JoinCTA />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

export default App;