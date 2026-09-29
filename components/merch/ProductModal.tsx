'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  Sparkles,
  CheckCircle,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Plus,
  Minus,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { useCart } from '@/lib/merch/CartContext';

export interface ProductDetailVariant {
  id: string | number;
  printify_variant_id: number;
  title: string;
  size?: string;
  color?: string;
  retail_price_cents: number;
  cost_cents?: number;
  is_enabled: boolean;
  is_in_stock: boolean;
}

export interface StoreProduct {
  id: string;
  printify_product_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  badge?: string;
  is_limited_drop?: boolean;
  is_coming_soon?: boolean;
  retail_price_cents: number;
  mockup_images: Array<{
    src: string;
    position?: string;
    is_default?: boolean;
    variant_ids?: number[];
  }>;
  details?: string[];
  variants: ProductDetailVariant[];
}

interface ProductModalProps {
  product: StoreProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addItem, setIsCartOpen, initiateCheckout } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Group unique colors and sizes from enabled variants
  const variants = product?.variants || [];
  const colors = Array.from(
    new Set(variants.map((v) => v.color).filter(Boolean))
  ) as string[];
  const sizes = Array.from(
    new Set(variants.map((v) => v.size).filter(Boolean))
  ) as string[];

  // Reset state when opening a new product
  useEffect(() => {
    if (isOpen && product) {
      document.body.style.overflow = 'hidden';
      setSelectedImageIndex(0);
      setQuantity(1);

      // Default to first available color and size
      const firstAvailable = variants.find((v) => v.is_in_stock && v.is_enabled) || variants[0];
      if (firstAvailable) {
        setSelectedColor(firstAvailable.color || null);
        setSelectedSize(firstAvailable.size || null);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  // Find active variant matching selected color & size
  const activeVariant = variants.find((v) => {
    const matchesColor = selectedColor ? v.color === selectedColor : true;
    const matchesSize = selectedSize ? v.size === selectedSize : true;
    return matchesColor && matchesSize;
  }) || variants[0];

  const currentPriceCents = activeVariant?.retail_price_cents || product?.retail_price_cents || 0;
  const isOutOfStock = activeVariant ? !activeVariant.is_in_stock || !activeVariant.is_enabled : false;
  const isComingSoon = product?.status === 'draft' || product?.is_coming_soon;

  const handleAddToCart = () => {
    if (!product || !activeVariant || isOutOfStock || isComingSoon) return;

    const primaryImage = product.mockup_images[selectedImageIndex]?.src || product.mockup_images[0]?.src || '';

    addItem(
      {
        printify_product_id: product.printify_product_id,
        printify_variant_id: activeVariant.printify_variant_id,
        product_id: product.id,
        title: product.title,
        variant_title: activeVariant.title,
        size: activeVariant.size,
        color: activeVariant.color,
        price_cents: currentPriceCents,
        image_url: primaryImage,
        slug: product.slug,
      },
      quantity
    );

    onClose();
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      initiateCheckout();
    }, 300);
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 lg:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-4xl max-h-[92vh] bg-dark-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-dark-950/80 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Gallery Column */}
            <div className="w-full md:w-1/2 bg-gradient-to-b from-dark-800 to-dark-950 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative">
              {/* Product Badge */}
              <div className="absolute top-6 left-6 z-20 flex gap-2">
                {product.badge && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-vital-500 text-white shadow-lg shadow-vital-500/30">
                    <Star size={10} className="fill-current" />
                    {product.badge}
                  </span>
                )}
                {product.is_limited_drop && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-purple-500 text-white">
                    <Sparkles size={10} />
                    Limited Drop
                  </span>
                )}
              </div>

              {/* Main Image */}
              <div className="aspect-square relative rounded-2xl overflow-hidden bg-dark-950/50 flex items-center justify-center mb-4">
                {product.mockup_images.length > 0 ? (
                  <img
                    src={product.mockup_images[selectedImageIndex]?.src || product.mockup_images[0]?.src}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag size={48} className="text-gray-700" />
                )}
              </div>

              {/* Thumbnail Strip */}
              {product.mockup_images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {product.mockup_images.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl border overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-vital-500 shadow-lg shadow-vital-500/30 scale-105'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Column */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto max-h-[50vh] md:max-h-[92vh] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-tech text-vital-400 uppercase tracking-[0.3em] block mb-2 font-bold">
                  {product.category}
                </span>

                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight mb-2">
                  {product.title}
                </h2>

                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-display font-black text-vital-400">
                    ${(currentPriceCents / 100).toFixed(2)}
                  </span>
                  {isOutOfStock && (
                    <span className="text-xs font-tech font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                      Variant Out of Stock
                    </span>
                  )}
                  {isComingSoon && (
                    <span className="text-xs font-tech font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      Coming Soon
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  {product.description || 'Premium official Vital RP merchandise manufactured on-demand.'}
                </p>

                {/* Color Selector */}
                {colors.length > 0 && (
                  <div className="mb-5">
                    <span className="text-xs font-tech text-gray-400 uppercase tracking-widest block mb-2 font-bold">
                      Color: <span className="text-white">{selectedColor}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            selectedColor === c
                              ? 'bg-vital-500 text-white border border-vital-400 shadow-md shadow-vital-500/30'
                              : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {sizes.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-tech text-gray-400 uppercase tracking-widest font-bold">
                        Size: <span className="text-white">{selectedSize}</span>
                      </span>
                      <button
                        onClick={() => setShowSizeGuide(!showSizeGuide)}
                        className="text-[11px] font-tech text-vital-400 hover:text-vital-300 underline cursor-pointer"
                      >
                        {showSizeGuide ? 'Hide size guide' : 'Size guide'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s) => {
                        const matchingVar = variants.find(
                          (v) => (selectedColor ? v.color === selectedColor : true) && v.size === s
                        );
                        const disabled = !matchingVar || !matchingVar.is_in_stock || !matchingVar.is_enabled;

                        return (
                          <button
                            key={s}
                            disabled={disabled}
                            onClick={() => setSelectedSize(s)}
                            className={`min-w-[44px] h-10 px-3 rounded-lg text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                              disabled
                                ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed line-through opacity-50'
                                : selectedSize === s
                                ? 'bg-vital-500 text-white border border-vital-400 shadow-md shadow-vital-500/30'
                                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    {showSizeGuide && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-dark-950/80 border border-white/10 rounded-xl text-xs font-tech text-gray-400"
                      >
                        <p className="font-bold text-white mb-1">Standard Unisex Retail Fit</p>
                        <p>True to size. For an oversized streetwear fit, we recommend ordering one size up.</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-6 flex items-center gap-4">
                  <span className="text-xs font-tech text-gray-400 uppercase tracking-widest font-bold">
                    Quantity
                  </span>
                  <div className="flex items-center gap-3 bg-dark-950 border border-white/10 rounded-xl px-3 py-1.5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-tech font-bold text-white min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Fulfillment Highlights */}
                <div className="space-y-2 mb-8 p-3.5 rounded-xl bg-dark-950/50 border border-white/5 text-xs font-tech text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                    <span>Direct-to-Garment (DTG) archival print</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-vital-400 flex-shrink-0" />
                    <span>Custom POD production: 2–4 business days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-400 flex-shrink-0" />
                    <span>Full carrier tracking provided via email & site</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                {isComingSoon ? (
                  <div className="w-full py-4 text-center text-sm font-tech font-bold uppercase tracking-widest text-vital-400 bg-vital-500/10 border border-vital-500/20 rounded-xl">
                    Coming Soon — Not Yet Released
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      icon={<ShoppingBag size={18} />}
                    >
                      {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                    >
                      Buy Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
