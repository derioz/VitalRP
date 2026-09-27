import React from 'react';
import type { Metadata } from 'next';
import { RulesCMS } from '@/components/admin/rules/RulesCMS';

export const metadata: Metadata = {
  title: 'Rules CMS | Vital RP Command Center',
  description: 'Manage and publish server legislation and constitution.',
};

export default function RulesAdminPage() {
  return <RulesCMS />;
}
