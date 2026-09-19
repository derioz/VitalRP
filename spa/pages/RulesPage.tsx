import React, { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ScrollToTop } from '../../components/ScrollToTop';
import { AdminControls } from '../../components/AdminControls';
import { StoreModal } from '../../components/StoreModal';
import { RulesView } from '../../components/rules/RulesView';

export const RulesPage: React.FC = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative">
      <AdminControls />
      <Navbar onOpenStore={() => setIsStoreOpen(true)} />
      <main className="relative z-10">
        <RulesView />
      </main>
      <Footer onOpenStore={() => setIsStoreOpen(true)} />
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
      <ScrollToTop />
    </div>
  );
};
