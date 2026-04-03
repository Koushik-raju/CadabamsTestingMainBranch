import { HomeIcon, MessageSquareIcon, CalendarIcon, UserIcon, LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navigationMenuItems: NavItem[] = [
  { key: 'home', label: 'Home', path: '/home', icon: HomeIcon },
  { key: 'ai', label: 'AI', path: '/new-chat', icon: MessageSquareIcon },
  { key: 'appointments', label: 'Appts', path: '/doctors-list', icon: CalendarIcon },
  { key: 'profile', label: 'Profile', path: '/profile', icon: UserIcon },
];
