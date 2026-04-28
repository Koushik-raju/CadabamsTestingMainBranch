/**
 * FILE: config/navigation.ts
 *
 * PURPOSE:
 *   Defines the bottom tab bar navigation items for the authenticated app shell.
 *   Matches the MindTalk design system's 5-tab structure: Home · Explore · AI · Appts · Profile.
 *
 * LOGIC OVERVIEW:
 *   Exports a typed NavItem array consumed by BottomNavigation. The "ai" tab is
 *   flagged as special (isSpecial: true) so the nav can render it as the raised
 *   orange circle in the centre. All other tabs render as standard line-icon tabs.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   NavItem              — shape of a single nav entry
 *   navigationMenuItems  — ordered 5-item array matching design system tab order
 *
 * DEPENDENCIES:
 *   lucide-react — icon components
 *
 * LAST UPDATED: 2026-04-28 — 5-tab redesign per MindTalk design system (Home/Explore/AI/Appts/Profile)
 */

import { CalendarIcon, CompassIcon, HomeIcon, MessageSquareIcon, UserIcon, LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  isSpecial?: boolean;
}

export const navigationMenuItems: NavItem[] = [
  { key: 'home',        label: 'Home',    path: '/home',         icon: HomeIcon },
  { key: 'explore',     label: 'Explore', path: '/wellness',     icon: CompassIcon },
  { key: 'ai',          label: 'AI',      path: '/chat/new',     icon: MessageSquareIcon, isSpecial: true },
  { key: 'appointments',label: 'Appts',   path: '/doctors-list', icon: CalendarIcon },
  { key: 'profile',     label: 'Profile', path: '/profile',      icon: UserIcon },
];
