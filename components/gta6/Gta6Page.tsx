'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { StoreModal } from '@/components/StoreModal';
import { Hero } from './Hero';
import { SectionNav } from './SectionNav';
import { Vision } from './Vision';
import { Principles } from './Principles';
import { Leonida } from './Leonida';
import { Roadmap } from './Roadmap';
import { Community } from './Community';
import { Faq } from './Faq';
import { Closing } from './Closing';

/**
 * The page shell. Navbar, Footer and StoreModal are client components that
 * share state, so the shell is a client boundary and the sections below it
 * stay server-renderable where they have no interactivity.
 */
export function Gta6Page() {
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  return (
    <div className="g6 relative min-h-screen">
      <Navbar onOpenStore={() => setIsStoreOpen(true)} />
      <SectionNav />
      <main className="relative z-10">
        <Hero />
        <Vision />
        <Principles />
        <Leonida />
        <Roadmap />
        <Community />
        <Faq />
        <Closing />
      </main>
      <Footer onOpenStore={() => setIsStoreOpen(true)} />
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
      <ScrollToTop />
    </div>
  );
}
