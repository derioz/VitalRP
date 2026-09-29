'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AdminControls } from '@/components/AdminControls';
import { StoreModal } from '@/components/StoreModal';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Button } from '@/components/Button';

export default function MerchPoliciesPage() {
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative">
      <AdminControls />
      <Navbar onOpenStore={() => setIsStoreOpen(true)} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 relative z-10">
        {/* Sub-Header Breadcrumb Bar */}
        <div className="py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 mb-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-tech tracking-wider uppercase text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Vital RP
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/merch" className="hover:text-vital-400 transition-colors">
              Merch
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-200 font-bold">Store Policies</span>
          </nav>

          <Link
            href="/merch"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-white border border-white/5 hover:border-white/20 transition-all uppercase tracking-wider"
          >
            <ArrowLeft size={13} />
            <span>Storefront</span>
          </Link>
        </div>

        <div className="mb-10 text-center sm:text-left">
          <span className="text-xs font-tech uppercase tracking-widest text-vital-400 font-bold block mb-1">
            Store Guidelines
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white mb-3">
            Fulfillment & Return Policy
          </h1>
          <p className="text-gray-400 text-sm font-sans">
            Vital RP merchandise is produced in partnership with Printify print-on-demand facilities.
          </p>
        </div>

        <div className="space-y-8 text-sm font-sans leading-relaxed text-gray-300">
          {/* Section 1: Production & Shipping */}
          <div className="bg-dark-800/40 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-vital-500/10 border border-vital-500/20 flex items-center justify-center text-vital-400">
                <Truck size={20} />
              </div>
              <h2 className="text-xl font-display font-bold text-white">
                1. Production & Shipping Timelines
              </h2>
            </div>
            <p className="mb-3">
              Because we do not maintain pre-manufactured bulk inventory, every garment and accessory is printed specifically when your order is placed.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-400 text-xs font-tech">
              <li><strong className="text-white">Production Time:</strong> 2 to 4 business days (manufacturing, printing, and inspection).</li>
              <li><strong className="text-white">Domestic Shipping (US):</strong> 3 to 6 business days after production via USPS, UPS, or FedEx.</li>
              <li><strong className="text-white">International Shipping:</strong> 7 to 15 business days depending on customs and local post.</li>
            </ul>
          </div>

          {/* Section 2: Damaged/Defective */}
          <div className="bg-dark-800/40 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <RotateCcw size={20} />
              </div>
              <h2 className="text-xl font-display font-bold text-white">
                2. Damaged or Defective Items (100% Guaranteed)
              </h2>
            </div>
            <p className="mb-3">
              If an item arrives with a print defect, fabric flaw, incorrect item, or is damaged in transit:
            </p>
            <p className="mb-3 text-white font-medium">
              We will promptly issue a <span className="text-vital-400">free replacement reprint</span> or a full refund at your preference.
            </p>
            <p className="text-xs font-tech text-gray-400">
              Please contact our support team within 30 days of package delivery with your Order Number and photo proof.
            </p>
          </div>

          {/* Section 3: Size Exchanges */}
          <div className="bg-dark-800/40 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl font-display font-bold text-white">
                3. Size Exchanges & Cancellations
              </h2>
            </div>
            <p className="mb-3">
              Because all products are custom printed uniquely for you, we cannot accept general returns for buyer&apos;s remorse or ordering the incorrect size.
            </p>
            <p className="text-xs font-tech text-gray-400">
              Please consult the sizing guides provided on each product drop before finalizing your checkout. If you need to cancel an order, you must do so within 2 hours of payment by opening a priority Discord support ticket.
            </p>
          </div>

          {/* Section 4: Contact & Support */}
          <div className="bg-dark-800/40 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm text-center sm:text-left">
            <div className="flex items-center gap-3 mb-4 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <HelpCircle size={20} />
              </div>
              <h2 className="text-xl font-display font-bold text-white">
                4. Need Assistance With an Order?
              </h2>
            </div>
            <p className="text-gray-400 text-xs font-tech mb-6">
              Our community staff and support team are available on Discord 24/7. Open a ticket in the <span className="text-vital-400">#support</span> channel or reach out via email.
            </p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Button href="https://discord.gg/vitalrp" target="_blank" rel="noreferrer" variant="primary" size="sm">
                Open Discord Ticket
              </Button>
              <Button href="/merch/orders" variant="outline" size="sm">
                Track Existing Order
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenStore={() => setIsStoreOpen(true)} />
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
      <ScrollToTop />
    </div>
  );
}
