import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { Features } from '../../components/Features';
import { Values } from '../../components/Values';
import { Staff } from '../../components/Staff';
import { Gallery } from '../../components/Gallery';
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
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative transition-colors duration-700">
            {/* Admin Dashboard (Only shows if authorized - Legacy/Quick Edit) */}
            <AdminControls />

            {/* Horizontal Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-vital-500 to-vital-400 origin-left z-[100]"
                style={{ scaleX }}
            />

            {/* Global Background */}
            <ParallaxBackground />

            <Navbar onOpenStore={() => setIsStoreOpen(true)} />

            {/* Main Content - Relative to sit on top of background */}
            <main className="relative z-10">
                <Hero />
                <Features />
                <Values />
                <Staff />
                <Gallery />
                <Rules />
                <FAQ />
                <JoinCTA />
            </main>

            {/* Footer needs specific z-index handling */}
            <div className="relative z-10">
                <Footer onOpenStore={() => setIsStoreOpen(true)} />
            </div>

            {/* Global Modals */}
            <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />

            <ScrollToTop />
        </div>
    );
};
