import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, ArrowRight, Edit3 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { NavLink } from 'react-router-dom';

export const AdminControls: React.FC = () => {
  const { user, isAdmin, logout, toggleEditMode, editMode } = useAuth();

  if (!isAdmin || !user) return null;

  const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-dark-900/90 backdrop-blur-xl border border-vital-500/30 rounded-full p-2 pl-2 pr-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-2 group transition-all hover:border-vital-500/60"
      >
        {/* Dashboard Link */}
        <NavLink
          to="/admin"
          className="flex items-center gap-3 pl-2 pr-4 py-1.5 hover:bg-white/5 rounded-full transition-colors"
        >
          <div className="relative">
            <img
              src={avatarUrl}
              alt={user.displayName || 'Admin'}
              className="w-8 h-8 rounded-full border border-vital-500"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-dark-900 rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xs leading-none">{user.displayName}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] text-emerald-500 font-tech uppercase tracking-wider">Cloud Active</span>
            </div>
          </div>

          <ArrowRight size={14} className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </NavLink>

        <div className="h-6 w-px bg-white/10"></div>

        {/* Edit Mode Toggle */}
        <button
          onClick={toggleEditMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${editMode
            ? 'bg-vital-500 text-white border-vital-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
            : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'
            }`}
          title="Toggle Edit Mode"
        >
          <Edit3 size={14} className={editMode ? "animate-pulse" : ""} />
          <span className="text-xs font-bold">{editMode ? 'Editing On' : 'Edit Mode'}</span>
        </button>

        <div className="h-6 w-px bg-white/10"></div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </motion.div>
    </div>
  );
};