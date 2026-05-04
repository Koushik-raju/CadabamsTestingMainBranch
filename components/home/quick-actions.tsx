/**
 * FILE: components/home/quick-actions.tsx
 *
 * PURPOSE:
 *   Renders the Quick Actions grid on the home screen — a 2-column card grid
 *   of shortcut tiles linking to major app features.
 *
 * LOGIC OVERVIEW:
 *   ACTIONS defines the static list of tiles. Each tile uses the MTGlyphTile
 *   pattern: a soft tinted square (--mt-tint-* palette) with a centered line icon.
 *   Each card fires onActionClick with its key; the parent (home page) handles routing.
 *   Badge copy is sentence case and never uses alarm language.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   ACTIONS        — static config array: key, title, description, badge, icon, tint
 *   TintKey        — union of allowed tint names matching the design system palette
 *   onActionClick  — callback from parent; receives the action key string
 *
 * DEPENDENCIES:
 *   lucide-react   — icons
 *   shadcn Card, Badge
 *
 * LAST UPDATED: 2026-05-04 — removed mood/stress/sleep trackers; moved to TrackerBar component
 */

import { GlyphTile } from "@/components/shared/glyph-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  LucideIcon,
  Map,
  MessageCircle,
  Package,
  Pill,
  Wind,
} from "lucide-react";

import type { TintKey } from "@/components/shared/glyph-tile";

interface Action {
  key: string;
  title: string;
  description: string;
  badge: string;
  badgeVariant: "mt-blue" | "mt-purple" | "mt-green" | "mt-pink" | "mt-peach" | "mt-orange";
  icon: LucideIcon;
  tint: TintKey;
}

const ACTIONS: Action[] = [
  {
    key: "appointments",
    title: "Appointments",
    description: "View and manage your sessions.",
    badge: "My sessions",
    badgeVariant: "mt-green",
    icon: CalendarCheck,
    tint: "green",
  },
  {
    key: "assessment",
    title: "Assessments",
    description: "Check anxiety, mood and more.",
    badge: "Try one now",
    badgeVariant: "mt-purple",
    icon: ClipboardList,
    tint: "purple",
  },
  {
    key: "journey",
    title: "Guided journeys",
    description: "Structured paths for your mind.",
    badge: "Keep going",
    badgeVariant: "mt-green",
    icon: Map,
    tint: "green",
  },
  {
    key: "prescriptions",
    title: "Prescriptions",
    description: "Download your prescription PDFs.",
    badge: "View all",
    badgeVariant: "mt-pink",
    icon: Pill,
    tint: "pink",
  },
  {
    key: "packages",
    title: "Packages",
    description: "Comprehensive care plans.",
    badge: "Browse now",
    badgeVariant: "mt-peach",
    icon: Package,
    tint: "peach",
  },
  {
    key: "journal",
    title: "Journal and reflect",
    description: "Free-flow or guided prompts.",
    badge: "3-min gratitude",
    badgeVariant: "mt-blue",
    icon: BookOpen,
    tint: "blue",
  },
  {
    key: "mindful-minutes",
    title: "Mindful minutes",
    description: "Short guided mindfulness sessions.",
    badge: "Start now",
    badgeVariant: "mt-blue",
    icon: Wind,
    tint: "blue",
  },
  {
    key: "chat",
    title: "Chat",
    description: "Message your care team anytime.",
    badge: "Open chat",
    badgeVariant: "mt-purple",
    icon: MessageCircle,
    tint: "purple",
  },
  {
    key: "documents",
    title: "Documents",
    description: "Access your reports and files.",
    badge: "View files",
    badgeVariant: "mt-peach",
    icon: FileText,
    tint: "peach",
  },
];

interface Props {
  onActionClick?: (type: string) => void;
}

export function QuickActions({ onActionClick }: Props) {
  return (
    <div className="px-5 mb-10">
      <h3 className="mt-h3 text-[#0E1726] mb-5">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ key, title, description, badge, badgeVariant, icon: Icon, tint }) => {
          return (
            <Card
              key={key}
              className="cursor-pointer active:scale-[0.97] transition-transform duration-[140ms] overflow-hidden py-0"
              onClick={() => onActionClick?.(key)}
            >
              <CardContent className="p-4 flex flex-col items-start gap-3">
                <GlyphTile icon={Icon} tint={tint} />
                <div className="flex flex-col gap-1 flex-1">
                  <h4 className="text-[15px] font-bold leading-snug text-[#0E1726]">{title}</h4>
                  <p className="text-[11px] font-medium leading-tight line-clamp-2 text-[#6B7280]">
                    {description}
                  </p>
                </div>
                <Badge variant={badgeVariant} className="text-[10px] mt-auto">
                  {badge}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
