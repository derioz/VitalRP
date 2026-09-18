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
  isAdmin?: boolean;
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
  updateDisplayName: (name: string) => Promise<boolean>;
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
  updateDisplayName: async () => false,
});


export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const fetchSession = async () => {
    try {
      // 1. Retrieve client-side session from Supabase (to obtain JWT access token)
      const { data: { session: clientSession } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (clientSession?.access_token) {
        headers['Authorization'] = `Bearer ${clientSession.access_token}`;
      }

      // 2. Authoritative server-side verification via /api/auth/me (validates Discord Guild + Admin Role)
      try {
        const res = await fetch('/api/auth/me', {
          headers,
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          console.log(
            `[VitalAuth Client] /api/auth/me response -> authenticated: ${data.authenticated}, isAdmin: ${data.isAdmin}, user: "${data.user?.displayName || data.user?.username}"`
          );
          if (data.authenticated && data.user) {
            setUser({
              ...data.user,
              isAdmin: Boolean(data.isAdmin ?? data.user.isAdmin),
            });
            setIsAdmin(Boolean(data.isAdmin ?? data.user.isAdmin));
            setLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('[VitalAuth Client] /api/auth/me fetch failed:', apiErr);
      }

      // 3. Fallback: client session if server check is unreachable (never grants admin status without server)
      if (clientSession?.user) {
        console.log('[VitalAuth Client] Unverified server session; setting client fallback (isAdmin: false)');
        const meta = clientSession.user.user_metadata || {};
        const discordId =
          meta.provider_id ||
          meta.sub ||
          clientSession.user.identities?.find((i: any) => i.provider === 'discord')?.id ||
          '';

        const displayName =
          meta.custom_display_name ||
          meta.full_name ||
          meta.name ||
          meta.user_name ||
          clientSession.user.email ||
          'User';
        const username = meta.user_name || displayName;
        const avatar = meta.avatar_url || meta.picture || '';

        const authUserData: AuthUser = {
          id: clientSession.user.id,
          discordId,
          username,
          displayName,
          avatar,
          email: clientSession.user.email,
          role: 'user',
          permissions: defaultPermissions,
          isAdmin: false,
        };

        setUser(authUserData);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(null);
      setIsAdmin(false);
      setEditMode(false);
    } catch (err) {
      console.warn('[VitalAuth Client] Could not retrieve active session:', err);
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
      const targetPath = redirect.startsWith('/') ? redirect : '/' + redirect;
      const redirectUrl = `${origin}${targetPath}`;

      if (typeof window !== 'undefined') {
        localStorage.setItem('vital_auth_redirect', targetPath);
      }

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

  const updateDisplayName = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    try {
      const { error: authErr } = await supabase.auth.updateUser({
        data: { custom_display_name: trimmed },
      });
      if (authErr) throw authErr;

      if (user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({ display_name: trimmed })
            .eq('id', user.id);
        } catch {
          // Non-blocking if table is missing or constrained
        }
      }

      await fetchSession();
      return true;
    } catch (err) {
      console.error('Failed to update display name:', err);
      return false;
    }
  };

  const toggleEditMode = () => {
    if (isAdmin) {
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
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};