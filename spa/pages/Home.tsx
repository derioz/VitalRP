import React, { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { Features } from '../../components/Features';
import { HowToJoin } from '../../components/HowToJoin';
import { Values } from '../../components/Values';
import { Rules } from '../../components/Rules';
import { FAQ } from '../../components/FAQ';
import { JoinCTA } from '../../components/JoinCTA';
import { Footer } from '../../components/Footer';
import { ScrollToTop } from '../../components/ScrollToTop';
import { ParallaxBackground } from '../../components/ParallaxBackground';
import { AdminControls } from '../../components/AdminControls';
import { StoreModal } from '../../components/StoreModal';

export const Home: React.FC = () => {
    const [isStoreOpen, setIsStoreOpen] = useState(false);
    return (
        /* Reduced motion drops movement from every animation on the page */
        <MotionConfig reducedMotion="user">
          <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative transition-colors duration-700">
              {/* Admin Dashboard (Only shows if authorized - Legacy/Quick Edit) */}
              <AdminControls />

              {/* Global Background */}
              <ParallaxBackground />

              {/* Redesigned Floating Navbar */}
              <Navbar onOpenStore={() => setIsStoreOpen(true)} />

              {/* Main Content - Modular Section Slots */}
              <main className="relative z-10 flex flex-col">
                  {/* Hero Section */}
                  <div id="home-slot" className="relative w-full">
                      <Hero />
                  </div>

                  {/* How to join */}
                  <HowToJoin />

                  {/* Features Section */}
                  <div id="features-slot" className="relative w-full">
                      <Features />
                  </div>

                  {/* Values Section */}
                  <div id="values-slot" className="relative w-full">
                      <Values />
                  </div>

                  {/* Rules Section */}
                  <div id="rules-slot" className="relative w-full">
                      <Rules />
                  </div>

                  {/* FAQ Section */}
                  <div id="faq-slot" className="relative w-full">
                      <FAQ />
                  </div>

                  {/* Join CTA Section */}
                  <div id="join-slot" className="relative w-full">
                      <JoinCTA />
                  </div>
              </main>

              {/* Footer needs specific z-index handling */}
              <div className="relative z-10">
                  <Footer onOpenStore={() => setIsStoreOpen(true)} />
              </div>

              {/* Global Modals */}
              <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />

              <ScrollToTop />
          </div>
        </MotionConfig>
    );
};
