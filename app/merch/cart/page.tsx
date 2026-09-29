'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShieldCheck,
  Lock,
  Loader2,
  Truck,
} from 'lucide-react';
import { VitalLogo } from '@/components/VitalLogo';
import { Button } from '@/components/Button';
import { CartProvider, useCart } from '@/lib/merch/CartContext';

function CartPageContent() {
  const {
    items,
    totalItems,
    subtotalCents,
    updateQuantity,
    removeItem,
    clearCart,
    discount,
    applyDiscount,
    removeDiscount,
    isCheckingOut,
    initiateCheckout,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError(null);

    const result = await applyDiscount(promoInput.trim());
    setIsApplyingPromo(false);

    if (!result.success) {
      setPromoError(result.error || 'Invalid code');
    } else {
      setPromoInput('');
    }
  };

  const finalSubtotalCents = Math.max(
    0,
    subtotalCents - (discount?.discount_amount_cents || 0)
  );

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-vital-500 selection:text-white">
      {/* Top Bar */}
      <nav className="border-b border-white/10 bg-dark-950/80 backdrop-blur-md py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/merch"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-tech uppercase tracking-wider"
          >
            <ArrowLeft size={16} />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center gap-2">
            <VitalLogo className="w-7 h-7" />
            <span className="font-display font-bold text-sm tracking-wider">VITAL MERCH</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <span className="text-xs font-tech uppercase tracking-widest text-vital-400 font-bold block mb-1">
              Checkout Entry
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
              Shopping Cart ({totalItems})
            </h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-tech text-gray-500 hover:text-red-400 underline transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-dark-800/30 border border-white/10 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mx-auto mb-4">
              <ShoppingBag size={28} />
            </div>
            <h3 className="font-display font-bold text-white text-xl mb-2">
              Your Cart is Empty
            </h3>
            <p className="text-gray-400 text-xs font-tech mb-6 leading-relaxed">
              Explore the official Vital RP merch line including heavyweight hoodies, minimal graphic tees, stickers, and desk mats.
            </p>
            <Button href="/merch" variant="primary" size="md">
              Browse Collection
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Items Column */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.printify_variant_id}
                  className="p-5 rounded-2xl bg-dark-800/40 border border-white/5 flex gap-4 sm:gap-6 items-center"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-dark-950 border border-white/5 overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-white font-display font-bold text-base sm:text-lg truncate">
                        {item.title}
                      </h4>
                      <button
                        onClick={() => removeItem(item.printify_variant_id)}
                        className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p className="text-gray-400 text-xs font-tech uppercase tracking-wider mb-3">
                      {[item.variant_title, item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-lg p-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.printify_variant_id, item.quantity - 1)
                          }
                          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-tech font-bold text-white min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.printify_variant_id, item.quantity + 1)
                          }
                          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="text-vital-400 font-display font-bold text-base sm:text-lg">
                        ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Column */}
            <div className="bg-dark-800/40 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="font-display font-bold text-white text-lg">
                Order Summary
              </h3>

              {/* Promo Form */}
              {discount ? (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-tech">
                  <div className="flex items-center gap-2">
                    <Tag size={14} />
                    <span className="font-bold">{discount.code}</span>
                    <span>(-${(discount.discount_amount_cents / 100).toFixed(2)})</span>
                  </div>
                  <button
                    onClick={removeDiscount}
                    className="text-gray-400 hover:text-white text-xs underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 font-tech uppercase focus:outline-none focus:border-vital-500/50"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingPromo || !promoInput.trim()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-tech font-bold uppercase rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    {isApplyingPromo ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                  </button>
                </form>
              )}
              {promoError && (
                <p className="text-red-400 text-xs font-tech">{promoError}</p>
              )}

              {/* Breakdown */}
              <div className="space-y-2 text-xs font-tech border-t border-white/5 pt-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">${(subtotalCents / 100).toFixed(2)}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promo ({discount.code})</span>
                    <span>-${(discount.discount_amount_cents / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-gray-400">Calculated at Stripe</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Sales Tax</span>
                  <span className="text-gray-400">Calculated at Stripe</span>
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-between text-base">
                  <span className="text-white font-display font-bold">Estimated Subtotal</span>
                  <span className="text-vital-400 font-display font-extrabold text-xl">
                    ${(finalSubtotalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={initiateCheckout}
                disabled={isCheckingOut}
                icon={isCheckingOut ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
              >
                {isCheckingOut ? 'Redirecting to Stripe...' : 'Proceed to Checkout'}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-tech text-gray-500 uppercase tracking-widest text-center">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>SSL Encrypted • Powered by Stripe</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CartPage() {
  return (
    <CartProvider>
      <CartPageContent />
    </CartProvider>
  );
}
