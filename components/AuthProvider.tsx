'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserPermissions } from '@/lib/auth/rbac';

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
  login: (redirect?: string) => void;
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
  login: () => {},
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
  }, []);

  const login = (redirect?: string) => {
    const target = redirect ? `/api/auth/discord/login?redirect=${encodeURIComponent(redirect)}` : '/api/auth/discord/login';
    window.location.href = target;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setEditMode(false);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/';
    }
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