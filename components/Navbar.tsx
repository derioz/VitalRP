'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LogOut, ExternalLink, Edit2, Check, Loader2 } from 'lucide-react';
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
    aria-hidden="true"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
  </svg>
);

interface NavbarProps {
  /** Kept so existing pages can keep passing it. The bar no longer links to the store. */
  onOpenStore?: () => void;
}

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/#features' },
  { name: 'About', href: '/#values' },
  { name: 'Rules', href: '/rules' },
  { name: 'GTA VI', href: '/gta6' },
  { name: 'FAQ', href: '/#faq' },
  { name: 'Join', href: '/#how-to-join' },
];

/** GTA VI entry point: sunset gradient on the label only, no glow. */
const GtaLabel = () => (
  <span className="bg-[linear-gradient(90deg,#f0709f,#fb923c_55%,#a98bf0)] bg-clip-text font-semibold text-transparent transition-[filter] duration-150 group-hover/gta:brightness-125">
    GTA VI
  </span>
);

const DISCORD_URL = 'https://discord.gg/vitalrp';
const PLAY_URL = 'https://connect.vitalrp.net';

/**
 * One bar, one container. The bar keeps the same height and the same inner
 * width at the top and after scrolling, so nothing can overflow or shift. Only
 * the surface (background and hairline) changes, with a short color
 * transition.
 */
export const Navbar: React.FC<NavbarProps> = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const { user, isAdmin, loading, login, logout, updateDisplayName } = useAuth();

  // Mobile display name edit state
  const [isEditingMobileName, setIsEditingMobileName] = useState(false);
  const [mobileName, setMobileName] = useState('');
  const [isSavingMobileName, setIsSavingMobileName] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the drawer when it is no longer a mobile layout or on Escape.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setIsMobileMenuOpen(false);
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
    };
  }, [isMobileMenuOpen]);

  const handleSaveMobileName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileName.trim()) return;
    setIsSavingMobileName(true);
    await updateDisplayName(mobileName.trim());
    setIsSavingMobileName(false);
    setIsEditingMobileName(false);
  };

  const onGta = !!pathname && pathname.startsWith('/gta6');
  const onHome = pathname === '/';
  // Pages that exist to bring new players in lead with the Discord at every width
  const joinFirst = onGta || onHome;

  const isCurrent = (href: string) => !href.includes('#') && href === pathname;

  const linkClass = (href: string) =>
    `relative flex h-14 items-center whitespace-nowrap px-2.5 text-sm font-display font-medium transition-colors duration-150 xl:px-3 ${
      isCurrent(href) ? 'text-white' : 'text-gray-300 hover:text-white'
    }`;

  const buttonBase =
    'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded px-3.5 text-sm font-display font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vital-400';

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`border-b transition-colors duration-200 ${
          isScrolled ? 'border-white/15 bg-dark-950' : 'border-white/10 bg-dark-950/80'
        }`}
      >
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-6 px-4 sm:px-8 lg:px-12">
          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Vital RP home">
            <VitalLogo className="h-8 w-8 shrink-0" />
            <span className="font-display text-lg font-semibold leading-none text-white">
              Vital <span className="text-vital-500">RP</span>
            </span>
          </Link>

          {/* Main links */}
          <nav aria-label="Main Navigation" className="hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center">
              {navLinks.map((link) => {
                const isGtaTab = onGta && link.href === '/gta6';
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      data-gta-tab={isGtaTab ? '' : undefined}
                      aria-current={isCurrent(link.href) ? 'page' : undefined}
                      className={`${linkClass(link.href)} ${link.href === '/gta6' ? 'group/gta' : ''} ${
                        isGtaTab
                          ? 'z-10 border-x border-white/10 bg-[#140e17]'
                          : ''
                      }`}
                    >
                      {link.href === '/gta6' ? <GtaLabel /> : link.name}
                      {isGtaTab ? (
                        <>
                          {/* Dusk rule on top, and a seal that opens the tab into the bar below */}
                          <span className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,#d65f93,#f97316_60%,#8e6bd8)]" />
                          <span className="absolute inset-x-0 -bottom-px h-px bg-[#140e17]" />
                        </>
                      ) : (
                        <span
                          className={`absolute inset-x-2.5 bottom-0 h-px bg-vital-500 transition-opacity duration-150 xl:inset-x-3 ${
                            isCurrent(link.href) ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Actions, set apart from the links by a divider */}
          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:border-l lg:border-white/10 lg:pl-6">
            {user && isAdmin && (
              <Link
                href="/admin"
                className="hidden h-9 items-center px-2 text-sm font-display font-medium text-gray-300 transition-colors hover:text-white xl:inline-flex"
              >
                Admin
              </Link>
            )}

            {/* On the homepage and GTA VI page the one button joins the Discord.
                Connecting and signing in are for people who are already in. */}
            {onHome && (
              <a
                href={PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Already whitelisted? Connect to the server"
                className="hidden h-9 items-center px-2 text-sm font-display font-medium text-gray-300 transition-colors hover:text-white xl:inline-flex"
              >
                Connect
              </a>
            )}
            {joinFirst ? (
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonBase} bg-vital-500 text-dark-950 hover:bg-vital-400`}
              >
                <DiscordLogo className="h-4 w-4" />
                Join Discord
              </a>
            ) : (
              <>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden h-9 items-center px-2 text-sm font-display font-medium text-gray-300 transition-colors hover:text-white xl:inline-flex"
                >
                  Discord
                </a>

                <a
                  href={PLAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonBase} hidden bg-vital-500 text-dark-950 hover:bg-vital-400 sm:inline-flex`}
                >
                  Play
                </a>
              </>
            )}

            {user ? (
              <ProfileDropdown />
            ) : onHome ? (
              <button
                onClick={() => login('/')}
                className="hidden h-9 items-center whitespace-nowrap px-2 text-sm font-display font-medium text-gray-300 transition-colors hover:text-white lg:inline-flex"
              >
                Sign in
              </button>
            ) : onGta ? null : loading ? (
              <div className="h-9 w-9 rounded-full border border-white/10 bg-dark-800" aria-hidden />
            ) : (
              <button
                onClick={() => login('/')}
                title="Sign in with Discord"
                className={`${buttonBase} border border-white/20 text-white hover:bg-white/10`}
              >
                <DiscordLogo className="h-4 w-4 text-[#8a94fd]" />
                <span className="hidden sm:inline">Login</span>
                <span className="sr-only sm:hidden">Login with Discord</span>
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded text-gray-300 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            >
              {isMobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="max-h-[calc(100svh-56px)] overflow-y-auto border-b border-white/15 bg-dark-950 lg:hidden"
          >
            <div className="mx-auto max-w-[1440px] px-4 pb-6 pt-2 sm:px-8">
              <ul className="divide-y divide-white/10">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isCurrent(link.href) ? 'page' : undefined}
                      className={`group/gta flex h-12 items-center font-display text-base font-medium transition-colors ${
                        isCurrent(link.href) ? 'text-vital-400' : 'text-gray-200 hover:text-white'
                      }`}
                    >
                      {link.href === '/gta6' ? <GtaLabel /> : link.name}
                    </a>
                  </li>
                ))}
              </ul>

              {/* On /gta6 the Join Discord button stays in the bar, so none is repeated here */}
              {onHome && (
                <div className="mt-4 grid border-t border-white/10 pt-4">
                  <a
                    href={PLAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonBase} h-11 border border-white/20 text-white hover:bg-white/10`}
                  >
                    Already whitelisted? Connect
                  </a>
                </div>
              )}
              {!joinFirst && (
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-1">
                  <a
                    href={PLAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonBase} h-11 bg-vital-500 text-dark-950 hover:bg-vital-400 sm:hidden`}
                  >
                    Play
                  </a>
                  <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonBase} h-11 border border-white/20 text-white hover:bg-white/10`}
                  >
                    Discord
                  </a>
                </div>
              )}

              {/* Account */}
              <div className={`mt-4 border-t border-white/10 pt-4 ${onGta && !user ? 'hidden' : ''}`}>
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
                        className="aspect-square h-10 w-10 rounded-full border border-white/20 object-cover"
                        width={40}
                        height={40}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-display text-sm font-semibold text-white">
                            {user.displayName}
                          </span>
                          {isAdmin && (
                            <span className="shrink-0 rounded border border-vital-500/30 bg-vital-500/20 px-1.5 py-0.5 text-[10px] font-tech font-bold text-vital-400">
                              Admin
                            </span>
                          )}
                        </div>
                        {user.username && (
                          <span className="truncate text-xs text-gray-400">@{user.username}</span>
                        )}
                      </div>
                    </div>

                    {!isEditingMobileName ? (
                      <button
                        onClick={() => {
                          setMobileName(user.displayName || '');
                          setIsEditingMobileName(true);
                        }}
                        className="flex w-full items-center justify-between rounded bg-white/5 px-3 py-2 text-xs font-tech text-gray-300 transition-colors hover:bg-white/10"
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
                          className="flex-1 rounded border border-white/15 bg-dark-800 px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:border-vital-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isSavingMobileName}
                          className="rounded bg-vital-500 p-2 text-dark-950"
                          aria-label="Save display name"
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
                          className="rounded bg-white/5 p-2 text-gray-400"
                          aria-label="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex w-full items-center justify-between rounded border border-vital-500/25 bg-vital-500/10 px-3 py-2.5 font-display text-sm font-medium text-vital-400"
                      >
                        <span>Admin Console</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded border border-red-500/20 bg-red-500/10 py-2.5 font-display text-sm font-medium text-red-400"
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      login('/');
                    }}
                    className={`${buttonBase} h-11 w-full ${
                      onHome
                        ? 'text-gray-200 hover:bg-white/10'
                        : 'bg-[#5865F2] text-white hover:bg-[#4752c4] sm:hidden'
                    }`}
                  >
                    <DiscordLogo className="h-4 w-4" />
                    <span>{onHome ? 'Member and staff sign in' : 'Login with Discord'}</span>
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
