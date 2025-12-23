import { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface StaffMember {
  name: string;
  role: string;
  avatar: string;
}

export interface ServerStat {
  label: string;
  value: string;
  icon: LucideIcon;
}