'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  ArrowLeft,
  Truck,
  Search,
  Package,
  Calendar,
  ChevronRight,
  ExternalLink,
  Loader2,
  Clock,
  LogIn,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AdminControls } from '@/components/AdminControls';
import { StoreModal } from '@/components/StoreModal';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Button } from '@/components/Button';
import { useAuth } from '@/components/AuthProvider';

export default function OrdersHistoryPage() {
  const { user, login } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupNumber, setLookupNumber] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        const res = await fetch('/api/merch/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.warn('Could not fetch user orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [user]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupNumber.trim()) return;
    const cleanNum = lookupNumber.trim().toUpperCase();
    window.location.href = `/merch/order/${cleanNum}`;
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative">
      <AdminControls />
      <Navbar onOpenStore={() => setIsStoreOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 relative z-10">
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
            <span className="text-gray-200 font-bold">Track Orders</span>
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
            Fulfillment Tracking
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white mb-3">
            Track Merch Orders
          </h1>
          <p className="text-gray-400 text-sm font-sans max-w-lg">
            Look up any order by your Vital RP order number (e.g. VRP-XXXX-XXXX) to check production progress, carrier tracking, and delivery status.
          </p>
        </div>

        {/* Lookup Box */}
        <div className="bg-dark-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md mb-12 shadow-2xl">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Enter Order Number (e.g. VRP-202609-AB12)"
                value={lookupNumber}
                onChange={(e) => setLookupNumber(e.target.value)}
                className="w-full bg-dark-950/80 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 font-tech uppercase tracking-wider focus:outline-none focus:border-vital-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-vital-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck size={14} />
              <span>Track Order</span>
            </button>
          </form>
        </div>

        {/* Recent Orders / Account Orders */}
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <Package size={18} className="text-vital-400" />
            <span>Your Merch Order History</span>
          </h2>

          {!user ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-dark-900/40 border border-white/5">
              <LogIn size={32} className="mx-auto text-gray-500 mb-3" />
              <p className="text-gray-300 font-display text-sm mb-4">
                Sign in with Discord to view past orders associated with your profile.
              </p>
              <Button onClick={() => login('/merch/orders')} variant="primary" size="sm">
                Sign in with Discord
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-xs font-tech gap-2">
              <Loader2 size={16} className="animate-spin text-vital-400" />
              <span>Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-dark-900/40 border border-white/5 text-gray-400 text-sm">
              <p className="mb-2">No orders found for your account yet.</p>
              <Link href="/merch" className="text-vital-400 hover:underline text-xs font-tech uppercase tracking-wider">
                Explore The Merch Store
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <Link
                  key={ord.id}
                  href={`/merch/order/${ord.order_number}`}
                  className="block p-5 rounded-2xl bg-dark-900/60 border border-white/5 hover:border-vital-500/30 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-black text-white text-lg group-hover:text-vital-400 transition-colors">
                        #{ord.order_number}
                      </span>
                      <span className="text-xs font-tech text-gray-500">
                        {new Date(ord.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-vital-500/10 text-vital-400 border border-vital-500/20">
                        {ord.fulfillment_status.replace('_', ' ')}
                      </span>
                      <span className="font-display font-bold text-white text-sm">
                        ${(ord.total_cents / 100).toFixed(2)}
                      </span>
                      <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  {ord.items && ord.items.length > 0 && (
                    <p className="text-xs font-tech text-gray-400 truncate">
                      {ord.items.map((i: any) => `${i.product_title} (${i.quantity}x)`).join(', ')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer onOpenStore={() => setIsStoreOpen(true)} />
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
      <ScrollToTop />
    </div>
  );
}
