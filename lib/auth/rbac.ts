export type Role =
  | 'owner'
  | 'management'
  | 'senior_admin'
  | 'admin'
  | 'moderator'
  | 'support'
  | 'staff'
  | 'user';

export type Permission =
  | 'canAccessAdmin'
  | 'canManageUsers'
  | 'canManageGallery'
  | 'canManageStaff'
  | 'canManageSettings';

export interface UserPermissions {
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canManageGallery: boolean;
  canManageStaff: boolean;
  canManageSettings: boolean;
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 100,
  management: 90,
  senior_admin: 80,
  admin: 70,
  moderator: 50,
  support: 40,
  staff: 30,
  user: 0,
};

export const ROLE_PERMISSIONS: Record<Role, UserPermissions> = {
  owner: {
    canAccessAdmin: true,
    canManageUsers: true,
    canManageGallery: true,
    canManageStaff: true,
    canManageSettings: true,
  },
  management: {
    canAccessAdmin: true,
    canManageUsers: true,
    canManageGallery: true,
    canManageStaff: true,
    canManageSettings: true,
  },
  senior_admin: {
    canAccessAdmin: true,
    canManageUsers: true,
    canManageGallery: true,
    canManageStaff: true,
    canManageSettings: true,
  },
  admin: {
    canAccessAdmin: true,
    canManageUsers: false,
    canManageGallery: true,
    canManageStaff: true,
    canManageSettings: true,
  },
  moderator: {
    canAccessAdmin: true,
    canManageUsers: false,
    canManageGallery: true,
    canManageStaff: false,
    canManageSettings: false,
  },
  support: {
    canAccessAdmin: true,
    canManageUsers: false,
    canManageGallery: false,
    canManageStaff: false,
    canManageSettings: false,
  },
  staff: {
    canAccessAdmin: true,
    canManageUsers: false,
    canManageGallery: false,
    canManageStaff: false,
    canManageSettings: false,
  },
  user: {
    canAccessAdmin: false,
    canManageUsers: false,
    canManageGallery: false,
    canManageStaff: false,
    canManageSettings: false,
  },
};

export function normalizeRole(role?: string | null): Role {
  if (!role) return 'user';
  const lower = role.toLowerCase().replace(/[\s-]+/g, '_');
  if (lower in ROLE_PERMISSIONS) {
    return lower as Role;
  }
  // Legacy role translations
  if (lower === 'superadmin') return 'senior_admin';
  if (lower === 'editor') return 'moderator';
  return 'user';
}

export function getPermissions(role: Role): UserPermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
}

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = getPermissions(role);
  return perms[permission] ?? false;
}

export const KNOWN_ADMIN_DISCORD_IDS: string[] = [
  '150580708144840704', // Space (Owner / Super Admin)
  '399373087172198400', // Craysteens (Admin)
];

export function isKnownAdminId(discordId?: string | null): boolean {
  if (!discordId) return false;
  if (KNOWN_ADMIN_DISCORD_IDS.includes(discordId)) return true;
  const envAdminIds =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ADMIN_DISCORD_IDS) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADMIN_DISCORD_IDS) ||
    '';
  if (envAdminIds) {
    const ids = envAdminIds.split(',').map((id: string) => id.trim());
    if (ids.includes(discordId)) return true;
  }
  return false;
}
