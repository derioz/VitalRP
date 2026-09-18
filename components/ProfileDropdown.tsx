'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LogOut,
  Edit2,
  Check,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from './AuthProvider';

export const ProfileDropdown: React.FC = () => {
  const { user, isAdmin, logout, updateDisplayName } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditingName(false);
        setFeedbackMsg(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsEditingName(false);
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const avatarUrl =
    user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=f97316&color=fff`;

  const handleStartEditing = () => {
    setNewName(user.displayName || '');
    setIsEditingName(true);
    setFeedbackMsg(null);
  };

  const handleSaveDisplayName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || trimmed === user.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    const success = await updateDisplayName(trimmed);
    setIsSavingName(false);

    if (success) {
      setIsEditingName(false);
      setFeedbackMsg('Display name updated!');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setFeedbackMsg('Failed to update name');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Profile Trigger: Displays ONLY the user's Discord avatar (1:1 ratio) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="User profile menu"
        aria-expanded={isOpen}
        className="relative flex items-center justify-center rounded-full p-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-vital-500/50 hover:scale-105 group"
      >
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-vital-500 transition-colors bg-dark-800 shadow-md shadow-black/40">
          <img
            src={avatarUrl}
            alt={user.displayName || 'Profile'}
            className="w-full h-full object-cover aspect-square"
            width={40}
            height={40}
          />
        </div>
        {/* Status ring dot */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-dark-950 ${
            isAdmin ? 'bg-vital-500' : 'bg-emerald-500'
          }`}
          title={isAdmin ? 'Admin' : 'Online'}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-72 sm:w-80 rounded-2xl bg-dark-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-4 z-50 divide-y divide-white/5"
          >
            {/* User Details Header */}
            <div className="pb-3.5">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/15 shrink-0 bg-dark-800">
                  <img
                    src={avatarUrl}
                    alt={user.displayName || 'User'}
                    className="w-full h-full object-cover aspect-square"
                    width={48}
                    height={48}
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-display font-bold text-base truncate">
                      {user.displayName}
                    </span>
                    {isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-tech font-bold uppercase tracking-wider bg-vital-500/20 text-vital-400 border border-vital-500/30 shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  {user.username && user.username !== user.displayName && (
                    <span className="text-gray-400 text-xs truncate">
                      @{user.username}
                    </span>
                  )}
                </div>
              </div>

              {/* Display Name Edit Feature */}
              <div className="mt-3 pt-2.5 border-t border-white/5">
                {!isEditingName ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-tech text-gray-400 uppercase tracking-wider">
                      Website Name
                    </span>
                    <button
                      onClick={handleStartEditing}
                      className="inline-flex items-center gap-1.5 text-xs text-vital-400 hover:text-vital-300 font-medium transition-colors"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveDisplayName} className="space-y-2 mt-1">
                    <label className="text-[10px] font-tech text-gray-400 uppercase tracking-wider block">
                      Change Display Name
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New display name"
                        maxLength={32}
                        autoFocus
                        disabled={isSavingName}
                        className="flex-1 bg-dark-800 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vital-500"
                      />
                      <button
                        type="submit"
                        disabled={isSavingName}
                        aria-label="Save name"
                        className="p-1.5 rounded-lg bg-vital-500 hover:bg-vital-400 text-white transition-colors disabled:opacity-50"
                      >
                        {isSavingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        disabled={isSavingName}
                        aria-label="Cancel editing"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                )}

                {feedbackMsg && (
                  <p className="text-[10px] text-emerald-400 font-tech mt-1.5">
                    {feedbackMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Section */}
            <div className="py-2 space-y-1">
              {/* Admin Panel Button — ONLY shown to users verified with Discord Admin Role */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-vital-500/10 hover:bg-vital-500/20 text-vital-400 border border-vital-500/20 hover:border-vital-500/40 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield size={16} className="text-vital-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-tech font-bold uppercase tracking-wider">
                      Admin Panel
                    </span>
                  </div>
                  <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
                </Link>
              )}

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-tech font-bold uppercase tracking-wider text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 text-left"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
