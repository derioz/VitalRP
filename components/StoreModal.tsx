import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShoppingCart, Loader2 } from 'lucide-react';

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
              className="w-full max-w-6xl h-[85vh] bg-dark-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-dark-900 z-10 shrink-0">
                <div className="flex items-center gap-3">
                   <div className="bg-vital-500/10 p-2 rounded-lg text-vital-500">
                      <ShoppingCart size={20} />
                   </div>
                   <div>
                      <h3 className="font-display font-bold text-white text-lg leading-none">Vital Store</h3>
                      <p className="text-xs text-gray-500 font-tech uppercase tracking-wider mt-0.5">Secure Checkout</p>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <a
                     href="https://vitalrp.tebex.io/"
                     target="_blank"
                     rel="noreferrer"
                     className="hidden md:flex items-center gap-2 px-4 py-2 bg-vital-600 hover:bg-vital-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-vital-500/20"
                   >
                      <span>Open in New Tab</span>
                      <ExternalLink size={14} />
                   </a>
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
              <div className="flex-1 relative bg-dark-950 w-full h-full">
                 {/* Loading / Fallback State (Visible while iframe loads or if it fails) */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0">
                    <Loader2 size={32} className="animate-spin mb-4 text-vital-500" />
                    <p className="font-medium text-gray-400">Loading Store Interface...</p>
                    <p className="text-sm mt-2 max-w-xs text-center text-gray-600">
                        If the store does not appear shortly, please use the "Open in New Tab" button.
                    </p>
                 </div>

                 {/* Store Iframe */}
                 <iframe
                   src="https://vitalrp.tebex.io/"
                   title="Vital RP Store"
                   className="absolute inset-0 w-full h-full border-0 z-10 bg-transparent"
                   allow="payment"
                   sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                 />
              </div>
              
              {/* Mobile Footer CTA */}
              <div className="md:hidden p-4 border-t border-white/5 bg-dark-900 z-10 shrink-0">
                 <a
                     href="https://vitalrp.tebex.io/"
                     target="_blank"
                     rel="noreferrer"
                     className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-vital-600 text-white font-bold rounded-lg shadow-lg shadow-vital-500/20"
                   >
                      <span>Open in New Tab</span>
                      <ExternalLink size={16} />
                   </a>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};