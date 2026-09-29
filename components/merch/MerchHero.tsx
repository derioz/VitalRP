import React from 'react';
import { ShoppingBag, Sparkles, CheckCircle, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { StoreProduct, FALLBACK_PRODUCTS } from '../../lib/merch/catalog';

interface MerchHeroProps {
  onShopMerch?: () => void;
  onViewLatestDrops?: () => void;
  onSelectProduct?: (slug: string) => void;
  featuredProducts?: StoreProduct[];
}

export const MerchHero: React.FC<MerchHeroProps> = ({
  onShopMerch,
  onViewLatestDrops,
  onSelectProduct,
  featuredProducts,
}) => {
  const products = featuredProducts && featuredProducts.length > 0 ? featuredProducts : FALLBACK_PRODUCTS;
  
  // Pick primary & secondary items for the tasteful showcase
  const primaryItem = products[0] || FALLBACK_PRODUCTS[0];
  const secondaryItem = products[3] || products[1] || FALLBACK_PRODUCTS[1];

  return (
    <section className="relative overflow-hidden pt-4 pb-14 sm:pt-6 sm:pb-20 lg:pt-8 lg:pb-24">
      {/* ------------------------------------------------------------- */}
      {/* Subtle Background Lighting & Ambient Textures */}
      {/* ------------------------------------------------------------- */}
      {/* 1. Subtle Grid Pattern with radial mask */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_35%,#000_60%,transparent_100%)] pointer-events-none"
      />

      {/* 2. Soft Restrained Ambient Spotlights */}
      <div
        aria-hidden="true"
        className="absolute -top-20 left-1/6 w-96 h-96 bg-vital-500/[0.08] rounded-full blur-[100px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/4 right-10 w-96 h-96 bg-amber-500/[0.06] rounded-full blur-[120px] pointer-events-none"
      />

      {/* 3. Faint Abstract Vital RP Emblem Watermark */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 right-[2%] lg:right-[8%] w-80 sm:w-96 lg:w-[480px] aspect-square pointer-events-none select-none opacity-[0.04] filter grayscale contrast-200"
      >
        <img
          src="https://r2.fivemanage.com/image/qlWrCeXTQdqx.png"
          alt=""
          className="w-full h-full object-contain rotate-[-8deg]"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Hero Content Container */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Heading, Copy, Actions & Trust Metrics */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Storefront Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vital-500/10 border border-vital-500/25 mb-6 backdrop-blur-sm shadow-[0_0_20px_rgba(249,115,22,0.12)]">
              <span className="w-1.5 h-1.5 rounded-full bg-vital-400 animate-pulse shadow-[0_0_8px_#f97316]" />
              <span className="text-[11px] font-tech text-vital-400 uppercase tracking-widest font-bold">
                Official Vital RP Merch
              </span>
            </div>

            {/* Main Headline with Personality Font */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black text-white leading-[1.04] tracking-tight mb-4 drop-shadow-sm">
              Official Vital RP{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 via-vital-500 to-amber-300">
                Merch.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-2xl font-display font-bold text-gray-200 tracking-tight mb-3">
              Represent Vital outside the city.
            </p>

            {/* Natural Body Copy */}
            <p className="text-sm sm:text-base text-gray-400 font-sans leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Shop shirts, hoodies, stickers, mugs, and other Vital RP merch. Everything is made to order and shipped directly to you.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8">
              <button
                type="button"
                onClick={onShopMerch}
                className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(249,115,22,0.35)] hover:shadow-[0_0_35px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 cursor-pointer"
              >
                <ShoppingBag size={15} />
                <span>Shop Merch</span>
                <ArrowRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onViewLatestDrops}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-dark-800/80 hover:bg-dark-700/80 text-gray-300 hover:text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer backdrop-blur-sm"
              >
                <Sparkles size={14} className="text-vital-400" />
                <span>View Latest Drops</span>
              </button>
            </div>

            {/* Informative Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 text-[11px] font-tech text-gray-400">
              <div className="inline-flex items-center gap-2 bg-dark-900/60 border border-white/5 px-3 py-1.5 rounded-lg">
                <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                <span>Made To Order</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-dark-900/60 border border-white/5 px-3 py-1.5 rounded-lg">
                <Truck size={13} className="text-vital-400 shrink-0" />
                <span>Direct Worldwide Shipping</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-dark-900/60 border border-white/5 px-3 py-1.5 rounded-lg">
                <ShieldCheck size={13} className="text-blue-400 shrink-0" />
                <span>Free Reprint Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tasteful Merch Visual Composition (Desktop / Tablet) */}
          <div className="lg:col-span-5 hidden sm:block">
            <div className="relative max-w-md mx-auto lg:max-w-none">
              
              {/* Secondary Layered Card (Tee) */}
              {secondaryItem && (
                <div
                  onClick={() => onSelectProduct && onSelectProduct(secondaryItem.slug)}
                  className="absolute -top-4 -right-2 sm:-right-4 w-52 sm:w-60 rounded-3xl bg-dark-900/70 border border-white/10 p-3.5 shadow-2xl backdrop-blur-md transform rotate-3 hover:rotate-0 transition-transform duration-300 cursor-pointer group z-10 hover:border-vital-500/40"
                >
                  <div className="relative aspect-square rounded-2xl bg-dark-800/80 overflow-hidden flex items-center justify-center p-3 mb-2.5">
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-dark-950/80 border border-white/10 text-[9px] font-tech text-vital-400 font-bold uppercase tracking-wider">
                      {secondaryItem.badge || 'Limited Drop'}
                    </span>
                    <img
                      src={secondaryItem.mockup_images[0]?.src}
                      alt={secondaryItem.title}
                      className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-display font-bold text-gray-200 truncate group-hover:text-vital-400 transition-colors">
                      {secondaryItem.title}
                    </h4>
                    <span className="text-xs font-tech font-bold text-vital-400 ml-2">
                      ${(secondaryItem.retail_price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Primary Featured Card (Hoodie) */}
              {primaryItem && (
                <div
                  onClick={() => onSelectProduct && onSelectProduct(primaryItem.slug)}
                  className="relative w-64 sm:w-72 lg:w-80 rounded-3xl bg-gradient-to-b from-dark-800/90 to-dark-900/90 border border-white/15 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(249,115,22,0.15)] backdrop-blur-lg transform -rotate-2 hover:rotate-0 transition-all duration-300 cursor-pointer group z-20 hover:border-vital-500/50"
                >
                  <div className="relative aspect-square rounded-2xl bg-gradient-to-b from-dark-800 to-dark-950/90 border border-white/5 overflow-hidden flex items-center justify-center p-4 mb-3.5">
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-vital-500 text-white text-[10px] font-tech font-bold uppercase tracking-wider shadow-lg shadow-vital-500/30 flex items-center gap-1">
                      <Sparkles size={10} />
                      {primaryItem.badge || 'Official Drop'}
                    </span>
                    <img
                      src={primaryItem.mockup_images[0]?.src}
                      alt={primaryItem.title}
                      className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm sm:text-base font-display font-bold text-white group-hover:text-vital-400 transition-colors">
                        {primaryItem.title}
                      </h3>
                      <span className="text-sm sm:text-base font-display font-black text-vital-400 ml-2 whitespace-nowrap">
                        ${(primaryItem.retail_price_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-tech text-gray-400 uppercase tracking-wider pt-2 border-t border-white/5">
                      <span>{primaryItem.category} • Official Drop</span>
                      <span className="text-vital-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>View</span>
                        <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
