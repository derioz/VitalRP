import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, LogOut, Edit3, X, Database, RefreshCw, Check } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const AdminControls: React.FC = () => {
  const { user, isAdmin, editMode, toggleEditMode, logout } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!isAdmin || !user) return null;

  const handleSave = () => {
    setSaving(true);
    // Since images save automatically to Supabase on-change,
    // this button acts as a "Sync/Refresh" to ensure you see what the server sees.
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-dark-900/90 backdrop-blur-xl border border-vital-500/30 rounded-full p-2 pl-4 pr-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-4"
      >
        {/* Admin Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={avatarUrl} 
              alt={user.username} 
              className="w-8 h-8 rounded-full border border-vital-500"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-dark-900 rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xs leading-none">{user.username}</span>
            <div className="flex items-center gap-1 mt-0.5">
               {isSupabaseConfigured ? (
                 <>
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[9px] text-emerald-500 font-tech uppercase tracking-wider">Cloud Active</span>
                 </>
               ) : (
                 <>
                   <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                   <span className="text-[9px] text-yellow-500 font-tech uppercase tracking-wider">Local Mode</span>
                 </>
               )}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10 mx-2"></div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          
          {/* Edit Mode Toggle */}
          <button
            onClick={toggleEditMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              editMode 
                ? 'bg-vital-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {editMode ? <X size={14} /> : <Edit3 size={14} />}
            {editMode ? 'Stop Editing' : 'Edit Mode'}
          </button>

          {/* Save / Sync Button */}
          {editMode && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`p-2 rounded-full transition-colors ${
                saving 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
              }`}
              title="Refresh Data"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            </button>
          )}

           {/* Logout */}
           <button
              onClick={logout}
              className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
        </div>
      </motion.div>
    </div>
  );
};