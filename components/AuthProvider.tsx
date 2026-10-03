'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserPermissions, getPermissions, normalizeRole, isKnownAdminId } from '@/lib/auth/rbac';
import { AppPermission, isSuperAdmin as checkIsSuperAdmin, isKnownAdmin, getAllPermissions } from '@/lib/auth/permissions';
import { supabase } from '@/lib/supabase/client';
import { getApiUrl } from '@/lib/api-config';

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
  effectivePermissions: AppPermission[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  discordRoles: string[];
  matchedRoleNames: string[];
  roleBreakdown: Record<string, string[]>;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  editMode: boolean;
  hasPermission: (perm: AppPermission) => boolean;
  toggleEditMode: () => void;
  login: (redirect?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  loading: true,
  editMode: false,
  hasPermission: () => false,
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const fetchSession = React.useCallback(async (forceRefresh = false) => {
    try {
      // 1. Retrieve client-side session from Supabase
      const { data: { session: clientSession } } = await supabase.auth.getSession();

      if (!clientSession?.user) {
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
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

      const userIsSuperAdmin = checkIsSuperAdmin(discordId);
      const userIsKnownAdmin = isKnownAdminId(discordId) || isKnownAdmin(discordId);
      let verifiedIsAdmin = userIsSuperAdmin || userIsKnownAdmin;
      let effectivePermissions: AppPermission[] = userIsSuperAdmin
        ? getAllPermissions()
        : userIsKnownAdmin
        ? [
            'admin.access',
            'rules.view',
            'rules.edit',
            'rules.publish',
            'rules.history',
            'staff.view',
            'staff.manage',
            'audit.view',
            'settings.manage',
            'merch.view',
            'merch.manage',
          ]
        : [];
      let discordRoles: string[] = [];
      let matchedRoleNames: string[] = userIsSuperAdmin
        ? ['Super Admin']
        : userIsKnownAdmin
        ? ['Administrator']
        : [];
      let roleBreakdown: Record<string, string[]> = {};
      let userRole: Role = userIsSuperAdmin
        ? 'owner'
        : userIsKnownAdmin
        ? 'admin'
        : 'user';

      // 1b. Direct Supabase profile check (works on static SPA, offline, or Next.js)
      if (clientSession.user.id || discordId) {
        try {
          const profileQuery = clientSession.user.id
            ? supabase.from('profiles').select('role, display_name').eq('id', clientSession.user.id)
            : supabase.from('profiles').select('role, display_name').eq('discord_id', discordId);
          const { data: profile } = await profileQuery.maybeSingle();

          if (profile?.role === 'admin' || profile?.role === 'owner') {
            verifiedIsAdmin = true;
            if (profile.role === 'owner' || userIsSuperAdmin) {
              userRole = 'owner';
              effectivePermissions = getAllPermissions();
              matchedRoleNames = ['Super Admin'];
            } else {
              userRole = 'admin';
              if (effectivePermissions.length === 0) {
                effectivePermissions = [
                  'admin.access',
                  'rules.view',
                  'rules.edit',
                  'rules.publish',
                  'rules.history',
                  'staff.view',
                  'staff.manage',
                  'audit.view',
                  'settings.manage',
                  'merch.view',
                  'merch.manage',
                ];
              }
              if (matchedRoleNames.length === 0) {
                matchedRoleNames = ['Administrator'];
              }
            }
          }
        } catch {
          // Ignore profile check errors
        }
      }

      // 1c. Direct Supabase custom staff permissions check (works on static SPA & offline)
      if (discordId && !userIsSuperAdmin) {
        try {
          let customPerms: AppPermission[] | null = null;
          if (typeof window !== 'undefined') {
            const rawLocal = localStorage.getItem('vital_staff_permissions');
            if (rawLocal) {
              const parsed = JSON.parse(rawLocal);
              if (Array.isArray(parsed[discordId])) {
                customPerms = parsed[discordId];
              }
            }
          }
          const { data: permsRow } = await supabase
            .from('rule_categories')
            .select('description')
            .eq('id', '__staff_permissions__')
            .maybeSingle();
          if (permsRow?.description) {
            try {
              const parsed = JSON.parse(permsRow.description);
              if (Array.isArray(parsed[discordId])) {
                customPerms = parsed[discordId];
              }
            } catch {}
          }
          if (customPerms && customPerms.length > 0) {
            effectivePermissions = customPerms;
            if (customPerms.includes('admin.access')) {
              verifiedIsAdmin = true;
              if (userRole === 'user') userRole = 'admin';
              if (matchedRoleNames.length === 0) matchedRoleNames = ['Administrator'];
            }
          }
        } catch {
          // Ignore custom permission check errors
        }
      }

      // 2. Authoritative server-side verification via /api/auth/me (when on Next.js server)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const headers: Record<string, string> = {};
        if (clientSession.access_token) {
          headers['Authorization'] = `Bearer ${clientSession.access_token}`;
        }
        const apiUrl = getApiUrl(`/api/auth/me${forceRefresh ? '?refresh=true' : ''}`);
        const res = await fetch(apiUrl, {
          headers,
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            verifiedIsAdmin = Boolean(data.isAdmin) || verifiedIsAdmin;
            if (data.isSuperAdmin || userIsSuperAdmin) {
              verifiedIsAdmin = true;
              userRole = 'owner';
              effectivePermissions = getAllPermissions();
              matchedRoleNames = ['Super Admin'];
            } else {
              if (Array.isArray(data.permissions) && data.permissions.length > 0) {
                effectivePermissions = data.permissions;
              }
              if (Array.isArray(data.discordRoles)) discordRoles = data.discordRoles;
              if (Array.isArray(data.matchedRoleNames) && data.matchedRoleNames.length > 0) {
                matchedRoleNames = data.matchedRoleNames;
              }
              roleBreakdown = data.roleBreakdown || {};
              userRole = normalizeRole(data.user.role || (verifiedIsAdmin ? 'admin' : 'user'));
            }
          }
        }
      } catch {
        // Fallback for static SPA hosting or offline API
        if (userIsSuperAdmin) {
          verifiedIsAdmin = true;
          userRole = 'owner';
          effectivePermissions = getAllPermissions();
        } else if (userIsKnownAdmin) {
          verifiedIsAdmin = true;
          userRole = 'admin';
        }
      }

      const authUserData: AuthUser = {
        id: clientSession.user.id,
        discordId,
        username,
        displayName,
        avatar,
        photoURL: avatar,
        email: clientSession.user.email,
        role: userRole,
        permissions: getPermissions(userRole),
        effectivePermissions,
        isSuperAdmin: userIsSuperAdmin,
        isAdmin: verifiedIsAdmin,
        discordRoles,
        matchedRoleNames,
        roleBreakdown,
      };

      setUser(authUserData);
      setIsAdmin(verifiedIsAdmin);
      setIsSuperAdmin(userIsSuperAdmin);
      setLoading(false);
      return;
    } catch (err) {
      console.warn('[VitalAuth Client] Error retrieving active session:', err);
      setUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        fetchSession(true);
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Ignored if offline
    }
  }, [fetchSession]);

  const hasPermission = React.useCallback(
    (permission: AppPermission): boolean => {
      if (isSuperAdmin || user?.isSuperAdmin) return true;
      if (!user) return false;
      if ((isAdmin || user?.isAdmin) && (permission === 'merch.view' || permission === 'merch.manage')) {
        return true;
      }
      return user.effectivePermissions.includes(permission);
    },
    [isSuperAdmin, isAdmin, user]
  );

  const login = React.useCallback(async (redirect: string = '/') => {
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
  }, []);

  const logout = React.useCallback(async () => {
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
    setIsSuperAdmin(false);
    setEditMode(false);
    window.location.href = '/';
  }, []);

  const updateDisplayName = React.useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      try {
        const { error: authErr } = await supabase.auth.updateUser({
          data: { custom_display_name: trimmed },
        });
        if (authErr) throw authErr;

        if (user?.id) {
          try {
            await supabase.from('profiles').update({ display_name: trimmed }).eq('id', user.id);
          } catch {
            // Non-blocking
          }
        }

        await fetchSession(true);
        return true;
      } catch (err) {
        console.error('Failed to update display name:', err);
        return false;
      }
    },
    [user?.id, fetchSession]
  );

  const toggleEditMode = React.useCallback(() => {
    if (isAdmin) {
      setEditMode((prev) => !prev);
    }
  }, [isAdmin]);

  const contextValue = React.useMemo(
    () => ({
      user,
      isAdmin,
      isSuperAdmin,
      loading,
      editMode,
      hasPermission,
      toggleEditMode,
      login,
      logout,
      refresh: () => fetchSession(true),
      updateDisplayName,
    }),
    [user, isAdmin, isSuperAdmin, loading, editMode, hasPermission, toggleEditMode, login, logout, fetchSession, updateDisplayName]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};