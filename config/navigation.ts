/**
 * FILE: config/navigation.ts
 *
 * PURPOSE:
 *   Defines the bottom tab bar navigation items used across the authenticated app shell.
 *
 * LOGIC OVERVIEW:
 *   Exports a typed array of nav items consumed by BottomNavigation to render
 *   tab links with icons and labels.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   NavItem              — shape of a single nav entry
 *   navigationMenuItems  — ordered array of tab bar items
 *
 * DEPENDENCIES:
 *   lucide-react — icon components
 *
 * LAST UPDATED: 2026-04-17 — recreated after accidental deletion
 */
import { HomeIcon, MessageSquareIcon, CalendarIcon, UserIcon, LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navigationMenuItems: NavItem[] = [
  { key: 'home', label: 'Home', path: '/home', icon: HomeIcon },
  { key: 'ai', label: 'AI', path: '/chat/new', icon: MessageSquareIcon },
  { key: 'appointments', label: 'Appts', path: '/doctors-list', icon: CalendarIcon },
  { key: 'profile', label: 'Profile', path: '/profile', icon: UserIcon },
];
