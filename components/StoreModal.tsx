'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, AlertTriangle } from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  // Prevent scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="w-full max-w-xl bg-dark-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-dark-900 z-10 shrink-0">
                <div className="flex items-center gap-3">
                   <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400">
                      <ShoppingCart size={20} />
                   </div>
                   <div>
                      <h3 className="font-display font-bold text-white text-lg leading-none">Vital Store</h3>
                      <p className="text-xs text-amber-400 font-tech uppercase tracking-wider mt-0.5">Temporarily Unavailable</p>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <button
                     onClick={onClose}
                     className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                     aria-label="Close"
                   >
                      <X size={20} />
                   </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="relative bg-dark-950 w-full p-8 sm:p-10 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
                    <AlertTriangle size={32} />
                 </div>
                 <h4 className="font-display font-bold text-white text-xl sm:text-2xl mb-2">Store Temporarily Unavailable</h4>
                 <p className="text-gray-400 text-sm max-w-md font-sans leading-relaxed mb-6">
                    The Vital RP Tebex store is currently offline for maintenance and updates. Please check back soon or join our Discord community for official announcements.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                   <a
                     href="https://discord.gg/vitalrp"
                     target="_blank"
                     rel="noreferrer"
                     className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-vital-500/20 transition-all"
                   >
                     <span>Join Discord for Updates</span>
                   </a>
                   <button
                     onClick={onClose}
                     className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-tech font-bold text-xs uppercase tracking-wider transition-colors border border-white/10"
                   >
                     Close
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};