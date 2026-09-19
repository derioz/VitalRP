'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { AdminControls } from '@/components/AdminControls';
import { StoreModal } from '@/components/StoreModal';
import { RulesView } from '@/components/rules/RulesView';

export default function RulesPageClient() {
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative">
      {/* Floating Admin Controls */}
      <AdminControls />

      {/* Floating Navbar */}
      <Navbar onOpenStore={() => setIsStoreOpen(true)} />

      {/* 21st.dev Rules System */}
      <main className="relative z-10">
        <RulesView />
      </main>

      {/* Footer */}
      <Footer onOpenStore={() => setIsStoreOpen(true)} />

      {/* Tebex Store Modal */}
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />

      {/* Back to Top */}
      <ScrollToTop />
    </div>
  );
}
