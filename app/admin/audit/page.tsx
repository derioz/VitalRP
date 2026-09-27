import React from 'react';
import type { Metadata } from 'next';
import { AuditLogViewer } from '@/components/admin/audit/AuditLogViewer';

export const metadata: Metadata = {
  title: 'Audit History | Vital RP Command Center',
  description: 'Chronological ledger of administrative and rules management changes.',
};

export default function AuditAdminPage() {
  return <AuditLogViewer />;
}
