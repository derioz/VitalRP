'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Gamepad2,
  ShoppingCart,
  MessageSquare,
  Shirt,
  LogIn,
  Shield,
  LogOut,
  ExternalLink,
  Edit2,
  Check,
  Loader2,
} from 'lucide-react';
import { VitalLogo } from './VitalLogo';
import { useAuth } from './AuthProvider';
import { ProfileDropdown } from './ProfileDropdown';

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
  onOpenStore?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStore }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);
  const [isForumsHovered, setIsForumsHovered] = useState(false);
  const forumsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, isAdmin, loading, login, logout, updateDisplayName } = useAuth();

  // Mobile display name edit state
  const [isEditingMobileName, setIsEditingMobileName] = useState(false);
  const [mobileName, setMobileName] = useState('');
  const [isSavingMobileName, setIsSavingMobileName] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleForumsMouseEnter = () => {
    forumsTimeoutRef.current = setTimeout(() => {
      setIsForumsHovered(true);
    }, 200);
  };

  const handleForumsMouseLeave = () => {
    if (forumsTimeoutRef.current) {
      clearTimeout(forumsTimeoutRef.current);
    }
    setIsForumsHovered(false);
  };

  const handleSaveMobileName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileName.trim()) return;
    setIsSavingMobileName(true);
    await updateDisplayName(mobileName.trim());
    setIsSavingMobileName(false);
    setIsEditingMobileName(false);
  };

  // Nav links exclude Gallery and Staff as per redesign phases
  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#values' },
    { name: 'Rules', href: '#rules' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Join', href: '#join' },
  ];

  const handleStoreClick = () => {
    if (onOpenStore) {
      onOpenStore();
    } else {
      window.open('https://vitalrp.tebex.io/', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Floating Glassmorphic Navigation Bar inspired by 21st.dev Navigation Menu */}
        <div
          className={`w-full flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border transition-all duration-300 shadow-2xl ${
            isScrolled
              ? 'bg-dark-950/90 backdrop-blur-2xl border-vital-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(249,115,22,0.15)]'
              : 'bg-dark-900/80 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Brand Logo & Status */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <VitalLogo className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-transform duration-200" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-display font-extrabold text-base sm:text-lg tracking-wider leading-none group-hover:text-vital-400 transition-colors">
                  VITAL
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-vital-500/15 border border-vital-500/30 text-[8px] font-tech text-vital-400 font-bold uppercase tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-vital-500 animate-ping" />
                  2.0
                </span>
              </div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600 font-tech text-[10px] tracking-[0.25em] leading-none font-bold mt-0.5">
                ROLEPLAY
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation Pills */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 bg-dark-950/40 p-1 rounded-full border border-white/5"
            onMouseLeave={() => setHoveredNavIndex(null)}
          >
            {navLinks.map((link, index) => {
              const isHovered = hoveredNavIndex === index;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onMouseEnter={() => setHoveredNavIndex(index)}
                  className="relative px-3.5 py-1.5 text-xs font-tech font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 rounded-full"
                >
                  {isHovered && (
                    <motion.div
                      layoutId="navbar-pill-indicator"
                      className="absolute inset-0 bg-white/10 rounded-full -z-10 border border-white/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Forums Hover Pill */}
            <div
              className="relative hidden xl:block"
              onMouseEnter={handleForumsMouseEnter}
              onMouseLeave={handleForumsMouseLeave}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <MessageSquare size={14} />
                <span>Forums</span>
              </button>
              <AnimatePresence>
                {isForumsHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-vital-500 text-dark-950 text-[10px] font-tech font-black px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-50 uppercase tracking-wider pointer-events-none"
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-vital-500 rotate-45" />
                    Coming Soon!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Merch Link */}
            <Link
              href="/merch"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <Shirt size={14} />
              <span>Merch</span>
            </Link>

            {/* Tebex Store */}
            <button
              onClick={handleStoreClick}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider text-gray-300 hover:text-vital-400 hover:bg-vital-500/10 rounded-full transition-colors border border-transparent hover:border-vital-500/20"
              title="Official VitalRP Tebex Store"
            >
              <ShoppingCart size={14} className="text-vital-400" />
              <span>Store</span>
            </button>

            {/* Discord */}
            <a
              href="https://discord.gg/vitalrp"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider text-gray-300 hover:text-[#5865F2] hover:bg-[#5865F2]/10 rounded-full transition-colors border border-transparent hover:border-[#5865F2]/30"
              title="Join VitalRP Discord"
            >
              <DiscordLogo className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>Discord</span>
            </a>

            {/* FiveM Play/Connect CTA */}
            <a
              href="https://cfx.re/join/ogpvmv"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-vital-500 to-vital-600 hover:from-vital-400 hover:to-vital-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-vital-500/20 hover:shadow-vital-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Gamepad2 size={14} />
              <span>Play</span>
            </a>

            {/* Profile Button / Discord Login Trigger */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-white/10">
              {loading ? (
                <div className="w-9 h-9 rounded-full bg-dark-800 animate-pulse border border-white/10" />
              ) : user ? (
                /* Profile Button: displays ONLY Discord avatar in 1:1 circular ratio */
                <ProfileDropdown />
              ) : (
                /* Login Button */
                <button
                  onClick={() => login('/admin')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5865F2]/15 hover:bg-[#5865F2]/25 text-[#8a94fd] hover:text-white border border-[#5865F2]/30 transition-all text-xs font-tech font-bold uppercase tracking-wider"
                  title="Sign in with Discord"
                >
                  <DiscordLogo className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-full transition-colors ml-1"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Glassmorphic Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="lg:hidden max-w-7xl mx-auto mt-2 pointer-events-auto"
          >
            <div className="bg-dark-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] divide-y divide-white/10 space-y-4">
              {/* Navigation Links */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-gray-200 hover:text-vital-400 font-tech font-bold text-xs uppercase tracking-wider border border-white/5 transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                <a
                  href="https://cfx.re/join/ogpvmv"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-vital-500 to-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-vital-500/25"
                >
                  <Gamepad2 size={16} />
                  <span>Connect to Server (FiveM)</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleStoreClick();
                    }}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 font-tech font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors"
                  >
                    <ShoppingCart size={14} className="text-vital-400" />
                    <span>Store</span>
                  </button>

                  <a
                    href="https://discord.gg/vitalrp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#8a94fd] font-tech font-bold text-xs uppercase tracking-wider border border-[#5865F2]/30 transition-colors"
                  >
                    <DiscordLogo className="w-3.5 h-3.5" />
                    <span>Discord</span>
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/merch"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 font-tech font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors"
                  >
                    <Shirt size={14} />
                    <span>Merch</span>
                  </Link>

                  <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-dark-800/50 text-gray-500 font-tech font-bold text-xs uppercase tracking-wider border border-white/5">
                    <MessageSquare size={14} />
                    <span>Forums (Soon)</span>
                  </div>
                </div>
              </div>

              {/* User Account / Profile in Mobile Menu */}
              <div className="pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.displayName || 'User'
                          )}&background=f97316&color=fff`
                        }
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full border border-white/20 aspect-square object-cover"
                        width={40}
                        height={40}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-display font-bold text-sm truncate">
                            {user.displayName}
                          </span>
                          {isAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-tech font-bold uppercase tracking-wider bg-vital-500/20 text-vital-400 border border-vital-500/30 shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        {user.username && (
                          <span className="text-gray-400 text-[11px] truncate">
                            @{user.username}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mobile Display Name Changer */}
                    {!isEditingMobileName ? (
                      <button
                        onClick={() => {
                          setMobileName(user.displayName || '');
                          setIsEditingMobileName(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-tech transition-colors"
                      >
                        <span>Change Display Name</span>
                        <Edit2 size={12} className="text-vital-400" />
                      </button>
                    ) : (
                      <form onSubmit={handleSaveMobileName} className="flex gap-1.5">
                        <input
                          type="text"
                          value={mobileName}
                          onChange={(e) => setMobileName(e.target.value)}
                          placeholder="New name"
                          maxLength={32}
                          className="flex-1 bg-dark-800 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vital-500"
                        />
                        <button
                          type="submit"
                          disabled={isSavingMobileName}
                          className="p-2 rounded-lg bg-vital-500 text-white"
                        >
                          {isSavingMobileName ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingMobileName(false)}
                          className="p-2 rounded-lg bg-white/5 text-gray-400"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    )}

                    {/* Admin Panel button on mobile ONLY if verified admin */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-vital-500/10 text-vital-400 border border-vital-500/25 text-xs font-tech font-bold uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={14} />
                          <span>Admin Panel</span>
                        </div>
                        <ExternalLink size={12} />
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-tech font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20"
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      login('/admin');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#5865F2]/20"
                  >
                    <DiscordLogo className="w-4 h-4" />
                    <span>Login with Discord</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};