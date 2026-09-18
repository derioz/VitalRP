'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserPermissions, getPermissions, normalizeRole, isKnownAdminId } from '@/lib/auth/rbac';
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
      // 1. Retrieve client-side session from Supabase
      const { data: { session: clientSession } } = await supabase.auth.getSession();

      if (!clientSession?.user) {
        setUser(null);
        setIsAdmin(false);
        setEditMode(false);
        setLoading(false);
        return;
      }

      // Extract Discord Snowflake ID
      const meta = clientSession.user.user_metadata || {};
      const appMeta = clientSession.user.app_metadata || {};
      const isSnowflake = (val: any): val is string =>
        typeof val === 'string' && /^\d{17,20}$/.test(val);

      const discordIdentity = clientSession.user.identities?.find((i: any) => i.provider === 'discord');
      const idData = discordIdentity?.identity_data;

      const discordId =
        (idData && isSnowflake(idData.id) ? idData.id : null) ||
        (idData && isSnowflake(idData.provider_id) ? idData.provider_id : null) ||
        (idData && isSnowflake(idData.sub) ? idData.sub : null) ||
        (isSnowflake(discordIdentity?.id) ? discordIdentity.id : null) ||
        (isSnowflake(meta.provider_id) ? meta.provider_id : null) ||
        (isSnowflake(meta.sub) ? meta.sub : null) ||
        (isSnowflake(meta.id) ? meta.id : null) ||
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

      // Initialize admin state from known admin Discord IDs
      let verifiedIsAdmin = isKnownAdminId(discordId);
      let userRole: Role = verifiedIsAdmin
        ? (discordId === '150580708144840704' ? 'owner' : 'admin')
        : 'user';

      // 2. Query Supabase profiles table for assigned role
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('id', clientSession.user.id)
          .maybeSingle();

        if (!profileErr && profile?.role) {
          const normalized = normalizeRole(profile.role);
          if (['owner', 'management', 'senior_admin', 'admin', 'moderator', 'staff'].includes(normalized)) {
            verifiedIsAdmin = true;
            userRole = normalized;
          }
        }
      } catch (profileErr) {
        console.warn('[VitalAuth Client] Error querying profile table:', profileErr);
      }

      // Check app metadata role if present
      if (appMeta?.role) {
        const normalized = normalizeRole(appMeta.role as string);
        if (['owner', 'management', 'senior_admin', 'admin', 'moderator', 'staff'].includes(normalized)) {
          verifiedIsAdmin = true;
          userRole = normalized;
        }
      }

      // 3. Authoritative server-side verification via /api/auth/me (when hosted on Next.js/Vercel)
      try {
        const headers: Record<string, string> = {};
        if (clientSession.access_token) {
          headers['Authorization'] = `Bearer ${clientSession.access_token}`;
        }
        const res = await fetch('/api/auth/me', {
          headers,
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            const serverIsAdmin = Boolean(data.isAdmin ?? data.user.isAdmin);
            if (serverIsAdmin) {
              verifiedIsAdmin = true;
              userRole = normalizeRole(data.user.role || 'admin');
            }
          }
        }
      } catch (apiErr) {
        // Expected on static hosting like GitHub Pages
      }

      const authUserData: AuthUser = {
        id: clientSession.user.id,
        discordId,
        username,
        displayName,
        avatar,
        email: clientSession.user.email,
        role: userRole,
        permissions: getPermissions(userRole),
        isAdmin: verifiedIsAdmin,
      };

      console.log(
        `[VitalAuth Client] Session active -> user="${displayName}", discordId="${discordId}", role="${userRole}", isAdmin=${verifiedIsAdmin}`
      );

      setUser(authUserData);
      setIsAdmin(verifiedIsAdmin);
      setLoading(false);
      return;
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

  const login = async (redirect: string = '/') => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const targetPath = redirect.startsWith('/') ? redirect : '/' + redirect;
      const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent(targetPath)}`;

      if (typeof window !== 'undefined') {
        localStorage.setItem('vital_auth_redirect', targetPath);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          scopes: 'identify email',
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