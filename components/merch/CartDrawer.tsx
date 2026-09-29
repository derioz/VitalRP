'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Loader2,
  Lock,
} from 'lucide-react';
import { useCart } from '@/lib/merch/CartContext';
import { Button } from '@/components/Button';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    totalItems,
    subtotalCents,
    updateQuantity,
    removeItem,
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
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-full max-w-md bg-dark-900 border-l border-white/10 h-full flex flex-col shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-dark-950/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-vital-500/10 border border-vital-500/20 flex items-center justify-center text-vital-400">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-white text-lg tracking-tight">
                    Your Cart
                  </h3>
                  <span className="text-[11px] font-tech text-gray-500 uppercase tracking-widest">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 mb-4">
                    <ShoppingBag size={28} />
                  </div>
                  <h4 className="text-white font-display font-bold text-lg mb-1">
                    Your Cart is Empty
                  </h4>
                  <p className="text-gray-500 text-xs font-tech max-w-xs mb-6">
                    Looks like you haven't picked out any Vital RP merch yet.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Explore Collection
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    layout
                    key={item.printify_variant_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-4 p-3.5 rounded-2xl bg-dark-800/60 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-dark-950/80 border border-white/5 overflow-hidden flex-shrink-0 relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-white font-display font-bold text-sm leading-tight truncate">
                            {item.title}
                          </h4>
                          <button
                            onClick={() => removeItem(item.printify_variant_id)}
                            className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-gray-500 text-xs font-tech uppercase tracking-wider mt-0.5 truncate">
                          {[item.variant_title, item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : '']
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-vital-400 font-display font-bold text-sm">
                          ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                        </span>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-lg p-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.printify_variant_id,
                                item.quantity - 1
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-tech font-bold text-white min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.printify_variant_id,
                                item.quantity + 1
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="p-5 border-t border-white/5 bg-dark-950/90 backdrop-blur-md space-y-4">
                {/* Promo Code Input */}
                {discount ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-tech">
                    <div className="flex items-center gap-2">
                      <Tag size={13} />
                      <span className="font-bold">{discount.code}</span>
                      <span>(-${(discount.discount_amount_cents / 100).toFixed(2)})</span>
                    </div>
                    <button
                      onClick={removeDiscount}
                      className="text-gray-400 hover:text-white text-[11px] underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 font-tech focus:outline-none focus:border-vital-500/50 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingPromo || !promoInput.trim()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-tech uppercase font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
                    >
                      {isApplyingPromo ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                    </button>
                  </form>
                )}
                {promoError && (
                  <p className="text-red-400 text-[11px] font-tech">{promoError}</p>
                )}

                {/* Subtotals */}
                <div className="space-y-1.5 text-xs font-tech">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white font-medium">
                      ${(subtotalCents / 100).toFixed(2)}
                    </span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({discount.code})</span>
                      <span>-${(discount.discount_amount_cents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Shipping & Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex justify-between text-sm">
                    <span className="text-white font-display font-bold">Estimated Total</span>
                    <span className="text-vital-400 font-display font-extrabold text-base">
                      ${(finalSubtotalCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={initiateCheckout}
                  disabled={isCheckingOut}
                  icon={isCheckingOut ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                >
                  {isCheckingOut ? 'Opening Checkout...' : 'Checkout with Stripe'}
                </Button>

                <div className="flex items-center justify-center gap-2 text-[10px] font-tech text-gray-500 uppercase tracking-widest text-center">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>256-Bit SSL Encrypted • Direct POD Fulfillment</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
