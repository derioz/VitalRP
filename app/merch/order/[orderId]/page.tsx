'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Truck,
  Package,
  Clock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VitalLogo } from '@/components/VitalLogo';
import { Button } from '@/components/Button';

interface OrderItem {
  id: string;
  product_title: string;
  variant_title: string;
  size?: string;
  color?: string;
  image_url?: string;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
}

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  printify_status: string;
  tracking_number?: string;
  carrier?: string;
  tracking_url?: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrderStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = (params?.orderId as string) || '';
  const isNewSuccess = searchParams.get('success') === 'true';

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/merch/orders/${orderId}`);
        if (!res.ok) {
          throw new Error('Order not found or could not be loaded.');
        }
        const data = await res.json();
        setOrder(data);

        // Fire celebration confetti if arriving directly from successful checkout
        if (isNewSuccess) {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f97316', '#10b981', '#ffffff'],
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isNewSuccess]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 size={36} className="animate-spin text-vital-500 mb-4" />
        <p className="font-tech text-sm text-gray-400">Loading Order Details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Order Not Found</h2>
        <p className="text-gray-400 text-sm font-tech max-w-md mb-6">
          {error || "We couldn't locate this order. Please verify your order number or check your confirmation email."}
        </p>
        <Button href="/merch" variant="primary">
          Back to Merch Store
        </Button>
      </div>
    );
  }

  // Determine stage progression
  const getFulfillmentStep = () => {
    switch (order.fulfillment_status) {
      case 'delivered':
        return 4;
      case 'shipped':
        return 3;
      case 'in_production':
        return 2;
      case 'submitted':
        return 1;
      default:
        return 0;
    }
  };

  const currentStep = getFulfillmentStep();

  const steps = [
    { label: 'Payment Confirmed', desc: 'Securely processed by Stripe' },
    { label: 'Sent to Production', desc: 'Accepted by Printify facility' },
    { label: 'Crafting & Quality Check', desc: 'Archival DTG printing' },
    { label: 'Shipped', desc: order.tracking_number ? `${order.carrier}: ${order.tracking_number}` : 'Carrier tracking generated' },
    { label: 'Delivered', desc: 'Arrived at your door' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-vital-500 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-dark-950/80 backdrop-blur-md py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/merch" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-tech uppercase tracking-wider">
            <ArrowLeft size={16} />
            <span>Back to Store</span>
          </Link>
          <div className="flex items-center gap-2">
            <VitalLogo className="w-7 h-7" />
            <span className="font-display font-bold text-sm tracking-wider">VITAL MERCH</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Header Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/40 border border-white/10 rounded-3xl p-6 sm:p-10 mb-8 backdrop-blur-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div>
              <span className="text-xs font-tech uppercase tracking-widest text-vital-400 font-bold block mb-1">
                Order Tracking
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
                #{order.order_number}
              </h1>
              <p className="text-gray-400 text-xs font-tech mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-tech font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Payment {order.payment_status}
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-tech font-bold uppercase tracking-wider bg-vital-500/10 text-vital-400 border border-vital-500/20">
                {order.fulfillment_status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Fulfillment Progress Timeline */}
          <div className="py-8">
            <h3 className="text-xs font-tech uppercase tracking-widest text-gray-400 font-bold mb-6">
              Fulfillment Timeline
            </h3>

            <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-5 gap-3 relative">
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={idx} className="flex sm:flex-col items-start gap-3 sm:gap-2 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-tech text-xs font-bold shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-vital-500 text-white shadow-lg shadow-vital-500/30'
                          : 'bg-white/5 text-gray-500 border border-white/10'
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={14} /> : idx + 1}
                    </div>

                    <div>
                      <h4
                        className={`text-xs font-display font-bold ${
                          isCurrent ? 'text-vital-400' : isCompleted ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-[11px] font-tech text-gray-500 leading-tight mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carrier Tracking Banner if Shipped */}
          {order.tracking_number && (
            <div className="mt-4 p-4 rounded-2xl bg-vital-500/10 border border-vital-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-tech uppercase tracking-widest text-vital-400 font-bold block">
                  Carrier Tracking Information
                </span>
                <p className="text-white text-sm font-tech font-bold mt-0.5">
                  {order.carrier || 'Carrier'}: <span className="font-mono text-gray-200">{order.tracking_number}</span>
                </p>
              </div>

              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shrink-0 shadow-lg shadow-vital-500/20"
                >
                  <span>Track Package</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
        </motion.div>

        {/* Order Details & Summary Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Items Column */}
          <div className="md:col-span-2 bg-dark-800/30 border border-white/10 rounded-3xl p-6 sm:p-8">
            <h3 className="font-display font-bold text-white text-lg mb-4">
              Items Ordered ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-white/5 space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-dark-950 border border-white/5 overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Package size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-white font-display font-bold text-sm truncate">
                        {item.product_title}
                      </h4>
                      <p className="text-gray-400 text-xs font-tech uppercase tracking-wider mt-0.5">
                        {[item.variant_title, item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-tech text-gray-400">
                      <span>Qty: {item.quantity}</span>
                      <span className="text-white font-bold">
                        ${((item.total_cents || item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="bg-dark-800/30 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-white text-lg mb-4">
                Payment Summary
              </h3>

              <div className="space-y-2.5 text-xs font-tech">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">${(order.subtotal_cents / 100).toFixed(2)}</span>
                </div>
                {order.discount_cents > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-${(order.discount_cents / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-white">${(order.shipping_cents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax</span>
                  <span className="text-white">${(order.tax_cents / 100).toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-white/5 flex justify-between text-sm">
                  <span className="text-white font-display font-bold">Total Paid</span>
                  <span className="text-vital-400 font-display font-extrabold text-base">
                    ${(order.total_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-xs font-tech text-gray-500">
                <span>Confirmation sent to:</span>
                <p className="text-white truncate font-medium mt-0.5">{order.customer_email}</p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5">
              <Button href="/merch" variant="outline" size="sm" fullWidth>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
