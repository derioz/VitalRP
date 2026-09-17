'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserPermissions, getPermissions, normalizeRole } from '@/lib/auth/rbac';
import { supabase } from '@/lib/supabase/client';

export interface AuthUser {
  id?: string;
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
  isAdmin: boolean;
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
  isAdmin: false,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const fetchSession = async () => {
    try {
      // 1. Check client-side Supabase session (works in both static /docs and dynamic hosting)
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const discordId =
          meta.provider_id ||
          meta.sub ||
          session.user.identities?.find((i: any) => i.provider === 'discord')?.id ||
          '';

        let role: Role = discordId === '150580708144840704' ? 'owner' : 'user';
        let displayName = meta.full_name || meta.name || meta.user_name || session.user.email || 'User';
        let username = meta.user_name || displayName;
        let avatar = meta.avatar_url || meta.picture || '';

        // Query Supabase profiles table for role if not owner
        if (role !== 'owner') {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, display_name, username, avatar_url')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile?.role) role = normalizeRole(profile.role);
            if (profile?.display_name) displayName = profile.display_name;
            if (profile?.username) username = profile.username;
            if (profile?.avatar_url) avatar = profile.avatar_url;
          } catch {
            // Ignore DB errors
          }
        }

        const permissions = getPermissions(role);
        const authUserData: AuthUser = {
          id: session.user.id,
          discordId,
          username,
          displayName,
          avatar,
          email: session.user.email,
          role,
          permissions,
        };

        setUser(authUserData);
        setIsAdmin(permissions.canAccessAdmin);
        setLoading(false);
        return;
      }

      // 2. Fallback check to /api/auth/me if in server environment (Next.js / Vercel)
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            setIsAdmin(data.user.permissions?.canAccessAdmin || false);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Not a server environment (e.g. GitHub Pages)
      }

      setUser(null);
      setIsAdmin(false);
      setEditMode(false);
    } catch (err) {
      console.warn('Could not retrieve active session:', err);
      setUser(null);
      setIsAdmin(false);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Listen to Supabase client auth state changes
    try {
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
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}${redirect.startsWith('/') ? redirect : '/' + redirect}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          scopes: 'identify email guilds.members.read',
        },
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const logout = async () => {
    try {
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
    setIsAdmin(false);
    setEditMode(false);
    window.location.href = '/';
  };

  const toggleEditMode = () => {
    if (user?.permissions.canManageGallery || user?.permissions.canManageStaff || isAdmin) {
      setEditMode((prev) => !prev);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
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