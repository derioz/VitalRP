import React from 'react';
import type { Metadata } from 'next';
import { StaffManager } from '@/components/admin/staff/StaffManager';

export const metadata: Metadata = {
  title: 'Staff Management | Vital RP Command Center',
  description: 'Manage Vital RP staff team, Discord roles, and assigned permissions.',
};

export default function StaffAdminPage() {
  return <StaffManager />;
}
