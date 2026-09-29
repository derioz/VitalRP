import React from 'react';

/**
 * Skeleton component for product cards on the catalog page (/merch)
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="block h-full bg-dark-900/60 border border-white/5 rounded-3xl overflow-hidden flex flex-col justify-between">
      {/* Mockup Container Skeleton */}
      <div className="relative aspect-square bg-gradient-to-b from-dark-800/80 to-dark-900 overflow-hidden flex items-center justify-center p-8 border-b border-white/5">
        <div className="absolute top-4 left-4 z-10 w-20 h-5 rounded-full bg-white/10 animate-pulse" />
        <div className="w-3/4 h-3/4 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Card Content Skeleton */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="h-5 w-3/5 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-5 w-16 rounded-lg bg-vital-500/20 animate-pulse ml-2" />
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-4/5 rounded bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* Card Footer Skeleton */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-20 rounded bg-vital-500/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * Grid of product card skeletons for the catalog page
 */
export const CatalogSkeletonGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

/**
 * Skeleton component for the dedicated product detail page (/merch/:slug)
 */
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 animate-pulse">
      {/* Left Column: Image Gallery Skeleton */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Main Large Mockup Preview Skeleton */}
        <div className="relative aspect-square w-full rounded-3xl bg-gradient-to-b from-dark-800/80 to-dark-900 border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
          <div className="w-1/2 h-1/2 rounded-3xl bg-white/5 animate-pulse" />
        </div>

        {/* Thumbnails Row Skeleton */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="w-20 h-20 rounded-2xl bg-dark-800/80 border border-white/10 flex-shrink-0 animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Right Column: Details, Sizing, Colors, Actions Skeleton */}
      <div className="lg:col-span-5 flex flex-col justify-between">
        <div>
          {/* Category & Badge */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="h-4 w-40 rounded-full bg-white/10 animate-pulse" />
            <div className="h-4 w-28 rounded-full bg-emerald-500/20 animate-pulse" />
          </div>

          {/* Title */}
          <div className="h-10 sm:h-12 w-4/5 rounded-2xl bg-white/10 animate-pulse mb-4" />

          {/* Price & Shipping */}
          <div className="flex items-baseline gap-3 mb-6">
            <div className="h-8 w-28 rounded-xl bg-vital-500/20 animate-pulse" />
            <div className="h-4 w-40 rounded-lg bg-white/5 animate-pulse" />
          </div>

          {/* Description Paragraph */}
          <div className="space-y-2 mb-6">
            <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-11/12 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-white/5 animate-pulse" />
          </div>

          {/* Color Selector Skeleton */}
          <div className="mb-6">
            <div className="h-3 w-24 rounded bg-white/10 animate-pulse mb-2.5" />
            <div className="flex gap-2">
              <div className="h-9 w-20 rounded-xl bg-dark-800 border border-white/10 animate-pulse" />
              <div className="h-9 w-20 rounded-xl bg-dark-800 border border-white/10 animate-pulse" />
            </div>
          </div>

          {/* Size Selector Skeleton */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2.5">
              <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
            </div>
            <div className="flex gap-2">
              {['S', 'M', 'L', 'XL'].map((s) => (
                <div key={s} className="w-12 h-10 rounded-xl bg-dark-800 border border-white/10 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Quantity Selector Skeleton */}
          <div className="mb-8">
            <div className="h-3 w-16 rounded bg-white/10 animate-pulse mb-2.5" />
            <div className="h-11 w-32 rounded-xl bg-dark-800 border border-white/10 animate-pulse" />
          </div>

          {/* Actions Skeleton */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1 h-14 rounded-2xl bg-vital-500/20 border border-vital-500/30 animate-pulse" />
            <div className="flex-1 h-14 rounded-2xl bg-dark-800 border border-white/10 animate-pulse" />
          </div>

          {/* Fulfillment Features Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-white/5">
            <div className="h-12 rounded-xl bg-dark-900/60 border border-white/5 animate-pulse" />
            <div className="h-12 rounded-xl bg-dark-900/60 border border-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
