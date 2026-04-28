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
 * LAST UPDATED: 2026-04-28 — Migrated to --mt-tint-* colors, sentence-case copy,
 *   MTGlyphTile glyph style, updated badge variants to mt-* tints
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  LucideIcon,
  Map,
  MessageCircle,
  Package,
  Pill,
  Smile,
  Wind,
} from "lucide-react";

/* Design system tint palette — matches --mt-tint-* CSS vars */
const TINTS: Record<string, { bg: string; fg: string }> = {
  blue: { bg: "#E8F1FF", fg: "#2C7BE5" },
  purple: { bg: "#F1EBFF", fg: "#6C5CE7" },
  green: { bg: "#E6F4EA", fg: "#1F8B4C" },
  pink: { bg: "#FFE6EA", fg: "#D03B5C" },
  peach: { bg: "#FFE9D9", fg: "#C9531A" },
  orange: { bg: "#FFE4D2", fg: "#E8620A" },
};

type TintKey = keyof typeof TINTS;

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
    key: "mood-tracker",
    title: "Mood Tracker",
    description: "Log your mood & view your report.",
    badge: "Daily check-in",
    badgeVariant: "mt-pink",
    icon: Smile,
    tint: "pink",
  },
  {
    key: "stress-tracker",
    title: "Stress Tracker",
    description: "Track your stress level & stressors.",
    badge: "Quick log",
    badgeVariant: "mt-orange",
    icon: Activity,
    tint: "orange",
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
          const { bg, fg } = TINTS[tint];
          return (
            <Card
              key={key}
              className="cursor-pointer active:scale-[0.97] transition-transform duration-[140ms] overflow-hidden py-0"
              onClick={() => onActionClick?.(key)}
            >
              <CardContent className="p-4 flex flex-col items-start gap-3">
                {/* MTGlyphTile pattern: tinted 44×44 square, centered glyph */}
                <div
                  className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}
                >
                  <Icon size={20} strokeWidth={2} style={{ color: fg }} />
                </div>
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
