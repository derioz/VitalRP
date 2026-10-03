import React from 'react';
import { Skeleton } from '../ui/skeleton';

/**
 * Skeleton for individual Character Cards in directory/homepage grids.
 * Matches exact aspect ratio and card padding to eliminate layout shift.
 */
export const CharacterCardSkeleton: React.FC = () => {
  return (
    <div className="h-full bg-dark-900/60 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between">
      {/* Character Image Placeholder */}
      <div className="relative aspect-[4/3] bg-dark-800/80 overflow-hidden flex items-center justify-center border-b border-white/5">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute top-3 left-3">
          <Skeleton className="w-16 h-5 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <Skeleton className="h-5 w-3/5 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-md bg-vital-500/10" />
          </div>
          <Skeleton className="h-3 w-4/5 rounded mb-3" />
          <div className="space-y-1.5 mt-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Grid of character card skeletons for directories or lists
 */
export const CharacterDirectorySkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <CharacterCardSkeleton key={idx} />
      ))}
    </div>
  );
};

/**
 * Skeleton for character infobox (on the right on desktop, top on mobile)
 */
export const CharacterInfoboxSkeleton: React.FC = () => {
  return (
    <div className="bg-dark-900/80 border border-white/10 rounded-2xl p-5 lg:p-6 backdrop-blur-md shadow-2xl flex flex-col gap-5">
      {/* Title */}
      <div className="text-center pb-4 border-b border-white/5 flex flex-col items-center gap-2">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>

      {/* Main Avatar Image (3:4 aspect ratio) */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-dark-800/80 border border-white/10">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* Structured Rows */}
      <div className="space-y-3 pt-2">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between py-1.5 border-b border-white/5">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3.5 w-32 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for the complete Character Detail Page (/wiki/characters/[slug])
 */
export const CharacterPageSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      {/* Breadcrumb / Top bar skeleton */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <span className="text-gray-600">/</span>
          <Skeleton className="h-4 w-20 rounded" />
          <span className="text-gray-600">/</span>
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-lg bg-vital-500/10" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Main Content (Left 8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8 order-2 lg:order-1">
          {/* Header Banner */}
          <div className="bg-dark-900/60 border border-white/5 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Skeleton className="h-5 w-20 rounded-full bg-vital-500/20" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-10 w-3/5 rounded-xl mb-3" />
            <Skeleton className="h-4 w-4/5 rounded mb-2" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>

          {/* Section 1: Overview */}
          <div className="bg-dark-900/40 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-4">
            <Skeleton className="h-6 w-36 rounded-lg mb-4" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>

          {/* Section 2: Biography */}
          <div className="bg-dark-900/40 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-4">
            <Skeleton className="h-6 w-48 rounded-lg mb-4" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <div className="pt-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded mt-2" />
            </div>
          </div>

          {/* Section 3: Relationships */}
          <div className="bg-dark-900/40 border border-white/5 rounded-2xl p-6 sm:p-8">
            <Skeleton className="h-6 w-40 rounded-lg mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RelationshipSkeleton />
              <RelationshipSkeleton />
            </div>
          </div>

          {/* Section 4: Gallery */}
          <div className="bg-dark-900/40 border border-white/5 rounded-2xl p-6 sm:p-8">
            <Skeleton className="h-6 w-32 rounded-lg mb-6" />
            <GallerySkeleton count={3} />
          </div>

          {/* Section 5: Backlinks / Referenced By */}
          <div className="bg-dark-900/40 border border-white/5 rounded-2xl p-6 sm:p-8">
            <Skeleton className="h-6 w-44 rounded-lg mb-4" />
            <div className="space-y-3">
              <BacklinkSkeleton />
              <BacklinkSkeleton />
            </div>
          </div>
        </div>

        {/* Infobox Column (Right 4 Cols) */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <div className="lg:sticky lg:top-28">
            <CharacterInfoboxSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for individual relationship card
 */
export const RelationshipSkeleton: React.FC = () => {
  return (
    <div className="bg-dark-800/60 border border-white/5 rounded-xl p-4 flex items-start gap-3.5">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3.5 w-16 rounded bg-vital-500/10" />
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton for photo gallery grid
 */
export const GallerySkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-dark-800/80 border border-white/5">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for backlink / "What links here" item
 */
export const BacklinkSkeleton: React.FC = () => {
  return (
    <div className="bg-dark-800/40 border border-white/5 rounded-xl p-3.5 flex items-start gap-3">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-20 rounded bg-white/10" />
        </div>
        <Skeleton className="h-3 w-full rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton for search results list / dropdown
 */
export const SearchResultSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 flex items-center gap-3.5 border-b border-white/5 last:border-b-0">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-14 rounded bg-vital-500/10" />
        </div>
        <Skeleton className="h-3 w-48 rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton for @ mention autocomplete in rich text editor
 */
export const AutocompleteSkeleton: React.FC = () => {
  return (
    <div className="p-2 space-y-1.5 w-72">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="p-2 flex items-center gap-2.5 rounded-lg bg-white/[0.03]">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for the main Wiki Homepage (/wiki)
 */
export const WikiHomeSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-12">
      {/* Hero Search Area */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32 rounded-full mx-auto bg-vital-500/20" />
        <Skeleton className="h-12 w-3/4 rounded-2xl mx-auto" />
        <Skeleton className="h-4 w-1/2 rounded mx-auto" />
        <Skeleton className="h-14 w-full rounded-2xl mt-6" />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Skeleton key={idx} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      {/* Featured / Recently Updated Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <CharacterDirectorySkeleton count={4} />
      </div>
    </div>
  );
};
