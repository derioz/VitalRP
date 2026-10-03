export const SUPER_ADMIN_DISCORD_ID = '150580708144840704';

// Safety net known admins synced from Discord (Head Admins, Senior Admins, Admins)
export const KNOWN_ADMIN_IDS = new Set<string>([
  SUPER_ADMIN_DISCORD_ID,  // Damon (Super Admin)
  '106419991343034368',   // Rue (Senior Admin)
  '209737624649203712',   // Strix (Head Admin)
  '557375299881533440',   // soupy (Head Admin)
  '218185947487928321',   // authenticbeth / Peaches (Admin)
  '222783354985119744',   // MrCarlile (Admin)
  '323896916347715584',   // NNEZZIE (Admin)
  '399373087172198400',   // Craysteens (Admin)
  '504708209936695307',   // gtschaos / Artemis (Admin)
  '762546436893442049',   // unit620 / IVY (Admin)
  '936385915075575869',   // o8ktr33 / Churro (Admin)
]);

export function isKnownAdmin(discordId?: string | null): boolean {
  if (!discordId) return false;
  return KNOWN_ADMIN_IDS.has(discordId);
}

export const ALL_PERMISSIONS = [
  'admin.access',
  'rules.view',
  'rules.edit',
  'rules.publish',
  'rules.history',
  'staff.view',
  'staff.manage',
  'permissions.manage',
  'audit.view',
  'settings.manage',
  'merch.view',
  'merch.manage',
  'wiki.view',
  'wiki.create',
  'wiki.edit',
  'wiki.upload',
  'wiki.moderate',
] as const;

export type AppPermission = typeof ALL_PERMISSIONS[number];

export interface PermissionDefinition {
  id: AppPermission;
  name: string;
  category: 'Administration' | 'Rules CMS' | 'Staff & Access' | 'System' | 'Merch Store' | 'Character Wiki';
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    id: 'admin.access',
    name: 'Access Admin Console',
    category: 'Administration',
    description: 'Allows entering and viewing the Vital RP Command Center.',
  },
  {
    id: 'rules.view',
    name: 'View Rules & Drafts',
    category: 'Rules CMS',
    description: 'Allows reading server rules, categories, and active draft edits.',
  },
  {
    id: 'rules.edit',
    name: 'Edit Rules & Categories',
    category: 'Rules CMS',
    description: 'Allows creating, modifying, reordering, and staging rule drafts.',
  },
  {
    id: 'rules.publish',
    name: 'Publish Rules',
    category: 'Rules CMS',
    description: 'Authorizes publishing staged drafts to live production and performing rollbacks.',
  },
  {
    id: 'rules.history',
    name: 'View Version & Change History',
    category: 'Rules CMS',
    description: 'Access to historical snapshots, changelogs, and audit diffs for rules.',
  },
  {
    id: 'staff.view',
    name: 'View Staff Roster',
    category: 'Staff & Access',
    description: 'View active staff members, their Discord roles, and assigned permissions.',
  },
  {
    id: 'staff.manage',
    name: 'Manage Staff Members',
    category: 'Staff & Access',
    description: 'Sync and manage staff member status in the administrative roster.',
  },
  {
    id: 'permissions.manage',
    name: 'Manage Role Permissions',
    category: 'Staff & Access',
    description: 'Map Discord server role IDs to website capabilities and permissions.',
  },
  {
    id: 'audit.view',
    name: 'View Audit Logs',
    category: 'System',
    description: 'Inspect chronological administrative actions and changes.',
  },
  {
    id: 'settings.manage',
    name: 'Manage System Settings',
    category: 'System',
    description: 'Configure website and server parameters.',
  },
  {
    id: 'merch.view',
    name: 'View Merch Dashboard & Orders',
    category: 'Merch Store',
    description: 'View orders, sales metrics, and Printify sync status.',
  },
  {
    id: 'merch.manage',
    name: 'Manage Merch Catalog & Sync',
    category: 'Merch Store',
    description: 'Edit prices, toggle product visibility, trigger Printify catalog sync, and manage orders.',
  },
  {
    id: 'wiki.view',
    name: 'View Character Wiki',
    category: 'Character Wiki',
    description: 'Public read access to browse character pages and lore.',
  },
  {
    id: 'wiki.create',
    name: 'Create Wiki Characters',
    category: 'Character Wiki',
    description: 'Authorized Whitelist players and staff to create new Wiki character pages.',
  },
  {
    id: 'wiki.edit',
    name: 'Edit Wiki Characters',
    category: 'Character Wiki',
    description: 'Authorized Whitelist players and staff to edit character details and bios.',
  },
  {
    id: 'wiki.upload',
    name: 'Upload Wiki Media',
    category: 'Character Wiki',
    description: 'Upload character portraits and gallery photos through FiveManage.',
  },
  {
    id: 'wiki.moderate',
    name: 'Moderate Character Wiki',
    category: 'Character Wiki',
    description: 'Administrative ability to archive, restore, and moderate Wiki pages and revisions.',
  },
];

/**
 * Checks if a Discord user is the permanent Super Admin.
 * Super Admin bypasses normal permission checks and cannot be demoted or locked out.
 */
export function isSuperAdmin(discordId?: string | null): boolean {
  if (!discordId) return false;
  return discordId === SUPER_ADMIN_DISCORD_ID;
}

/**
 * Checks if a user has a specific permission.
 * Super Admin always returns true.
 */
export function hasPermission(
  effectivePermissions: string[] | Set<string>,
  permission: AppPermission,
  discordId?: string | null
): boolean {
  if (isSuperAdmin(discordId)) {
    return true;
  }
  if (isKnownAdmin(discordId)) {
    return true;
  }
  if (effectivePermissions instanceof Set) {
    return effectivePermissions.has(permission);
  }
  return Array.isArray(effectivePermissions) && effectivePermissions.includes(permission);
}

/**
 * Validates if the user meets any of the required permissions.
 */
export function hasAnyPermission(
  effectivePermissions: string[] | Set<string>,
  permissions: AppPermission[],
  discordId?: string | null
): boolean {
  if (isSuperAdmin(discordId)) {
    return true;
  }
  return permissions.some((p) => hasPermission(effectivePermissions, p, discordId));
}

/**
 * Returns all permissions (used for Super Admin).
 */
export function getAllPermissions(): AppPermission[] {
  return [...ALL_PERMISSIONS];
}
