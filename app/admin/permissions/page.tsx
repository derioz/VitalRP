import React from 'react';
import type { Metadata } from 'next';
import { RolePermissionsManager } from '@/components/admin/permissions/RolePermissionsManager';

export const metadata: Metadata = {
  title: 'Discord Permissions | Vital RP Command Center',
  description: 'Map Discord server role IDs to website capabilities and permissions.',
};

export default function PermissionsAdminPage() {
  return <RolePermissionsManager />;
}
