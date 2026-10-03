'use client';

import React, { useState } from 'react';
import { WikiImage } from '../../lib/wiki/types';
import { X, ChevronLeft, ChevronRight, Maximize2, Calendar } from 'lucide-react';

interface CharacterGalleryProps {
  images: WikiImage[];
  characterName: string;
}

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({ images, characterName }) => {
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 bg-white/[0.02] border border-white/5 rounded-2xl">
        No gallery photos uploaded for {characterName} yet.
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeModalIndex !== null) {
      setActiveModalIndex((activeModalIndex - 1 + images.length) % images.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeModalIndex !== null) {
      setActiveModalIndex((activeModalIndex + 1) % images.length);
    }
  };

  const activeImage = activeModalIndex !== null ? images[activeModalIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            onClick={() => setActiveModalIndex(idx)}
            className="group relative aspect-video bg-dark-800 rounded-2xl overflow-hidden border border-white/10 hover:border-vital-500/50 cursor-pointer shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <img
              src={img.url}
              alt={img.caption || `${characterName} gallery photo ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
              <span className="text-[11px] text-gray-200 truncate flex items-center gap-1 font-medium">
                <Maximize2 size={12} className="text-vital-400" />
                {img.caption || 'View Fullsize'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveModalIndex(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          {/* Top Controls */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-3">
            <span className="text-xs font-tech text-gray-400">
              {activeModalIndex! + 1} / {images.length}
            </span>
            <button
              onClick={() => setActiveModalIndex(null)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-dark-900/80 hover:bg-vital-500 text-white border border-white/10 transition-colors shadow-2xl"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-dark-900/80 hover:bg-vital-500 text-white border border-white/10 transition-colors shadow-2xl"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl max-h-[80vh] flex flex-col items-center"
          >
            <img
              src={activeImage.url}
              alt={activeImage.caption || characterName}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
            />
            {/* Caption & Date */}
            <div className="mt-4 text-center max-w-2xl px-4 space-y-1">
              {activeImage.caption && (
                <p className="text-sm text-gray-200 font-medium">
                  {activeImage.caption}
                </p>
              )}
              {activeImage.date_taken && (
                <p className="text-xs text-vital-400 font-tech flex items-center justify-center gap-1">
                  <Calendar size={12} />
                  <span>{activeImage.date_taken}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
