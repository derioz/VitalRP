'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserPermissions } from '@/lib/auth/rbac';
import { createClient } from '@/lib/supabase/client';

export interface AuthUser {
  discordId: string;
  username: string;
  displayName: string;
  avatar: string;
  photoURL?: string;
  email?: string;
  role: Role;
  permissions: UserPermissions;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  editMode: boolean;
  toggleEditMode: () => void;
  login: (redirect?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultPermissions: UserPermissions = {
  canAccessAdmin: false,
  canManageUsers: false,
  canManageGallery: false,
  canManageStaff: false,
  canManageSettings: false,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  editMode: false,
  toggleEditMode: () => {},
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Failed to fetch session');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        setEditMode(false);
      }
    } catch (err) {
      console.warn('Could not retrieve active session:', err);
      setUser(null);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Listen to Supabase client auth changes
    try {
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        fetchSession();
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Ignored if offline
    }
  }, []);

  const login = async (redirect: string = '/admin') => {
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirect)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          scopes: 'identify email guilds.members.read',
        },
      });

      if (error || !data.url) {
        console.warn('Direct Supabase OAuth error, falling back to server route:', error);
        window.location.href = `/api/auth/discord/login?redirect=${encodeURIComponent(redirect)}`;
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      console.warn('Login error, falling back to server route:', err);
      window.location.href = `/api/auth/discord/login?redirect=${encodeURIComponent(redirect)}`;
    }
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    setUser(null);
    setEditMode(false);
    window.location.href = '/';
  };

  const toggleEditMode = () => {
    if (user?.permissions.canManageGallery || user?.permissions.canManageStaff) {
      setEditMode((prev) => !prev);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        editMode,
        toggleEditMode,
        login,
        logout,
        refresh: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};