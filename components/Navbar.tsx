import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Gamepad2, ShoppingCart, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

import { VitalLogo } from './VitalLogo';

const DiscordLogo = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    className={className}
  >
    <title>Discord</title>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
  </svg>
);

interface NavbarProps {
  onOpenStore: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStore }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isForumsHovered, setIsForumsHovered] = useState(false);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsForumsHovered(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsForumsHovered(false);
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#values' },
    { name: 'Staff', href: '#staff' },
    { name: 'Gallery', href: '#gallery' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
          ? 'bg-dark-900/95 md:bg-dark-900/90 md:backdrop-blur-md border-white/10 py-3 shadow-lg'
          : 'bg-transparent border-transparent py-6'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <VitalLogo className="w-12 h-12 flex-shrink-0 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-display font-bold text-xl tracking-widest leading-none">VITAL</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600 font-tech text-xs tracking-[0.3em] leading-none font-bold">ROLEPLAY</span>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-tech font-medium text-gray-400 hover:text-vital-400 transition-colors uppercase tracking-widest"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">

            {/* Forums Button with Tooltip */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Button variant="ghost" size="sm" icon={<MessageSquare size={18} />}>
                Forums
              </Button>
              <AnimatePresence>
                {isForumsHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-vital-500 text-dark-900 text-[10px] font-bold px-3 py-1.5 rounded shadow-lg whitespace-nowrap z-50 uppercase tracking-wider pointer-events-none"
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-vital-500 rotate-45"></div>
                    Coming Soon!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tebex Store - Triggers Modal */}
            <Button
              onClick={onOpenStore}
              variant="ghost"
              size="sm"
              icon={<ShoppingCart size={18} />}
            >
              Store
            </Button>

            {/* Discord */}
            <Button
              href="https://discord.gg/vitalrp"
              target="_blank"
              rel="noreferrer"
              variant="ghost"
              size="sm"
              icon={<DiscordLogo className="w-[18px] h-[18px]" />}
            >
              Discord
            </Button>

            {/* Connect */}
            <Button variant="primary" size="sm" icon={<Gamepad2 size={18} />}>
              Connect
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <button
              className="text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-900 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4 flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-display text-gray-300 hover:text-vital-400 block text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Button variant="outline" fullWidth icon={<MessageSquare size={18} />} className="opacity-75">
                  Forums (Soon)
                </Button>

                {/* Mobile Menu Store Button */}
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenStore();
                  }}
                  variant="outline"
                  fullWidth
                  icon={<ShoppingCart size={18} />}
                >
                  Store
                </Button>

                <Button
                  href="https://discord.gg/vitalrp"
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  fullWidth
                  icon={<DiscordLogo className="w-[18px] h-[18px]" />}
                >
                  Join Discord
                </Button>

                <Button variant="primary" fullWidth icon={<Gamepad2 size={18} />}>
                  Play Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};