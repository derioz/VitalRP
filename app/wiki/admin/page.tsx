import type { Metadata } from 'next';
import { WikiAdminView } from '@/components/wiki/WikiAdminView';

export const metadata: Metadata = {
  title: 'Wiki Moderation | Vital RP',
  description: 'Manage and moderate Vital RP Character Wiki pages and links.',
};

export default function WikiAdminPage() {
  return <WikiAdminView />;
}
