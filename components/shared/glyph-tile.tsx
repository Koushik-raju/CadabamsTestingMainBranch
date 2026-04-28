/**
 * FILE: components/shared/glyph-tile.tsx
 *
 * PURPOSE:
 *   Canonical MTGlyphTile component — the single source of truth for all icon
 *   tiles across the app. Flat tinted square with a centered Lucide icon,
 *   matching the Quick Actions pattern on the home screen.
 *
 * LOGIC OVERVIEW:
 *   Accepts a tint key (one of 6 brand-aligned colours), an icon component,
 *   and an optional size variant. Resolves bg/fg from the TINTS palette and
 *   renders a square with rounded corners, flat tinted background, and icon
 *   at strokeWidth=2. An optional text label (e.g. file extension) is rendered
 *   below the icon for document/file tiles.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   TINTS        — 6-colour brand palette (blue, purple, green, pink, peach, orange)
 *   TintKey      — union of TINTS keys
 *   GlyphTileProps — { icon, tint, size?, label? }
 *   GlyphTile    — default export
 *
 * DEPENDENCIES:
 *   lucide-react — icon component type
 *
 * LAST UPDATED: 2026-04-28 — Created as reusable MTGlyphTile; replaces all inline gradient tiles
 */

import type { ElementType } from "react";

/* ─── Tint palette ─────────────────────────────────────────────────────────
   Matches --mt-tint-* CSS vars. These are the only allowed tile colours.
   Never use Tailwind color classes or hex literals outside this object.     */
export const TINTS = {
  blue: { bg: "#E8F1FF", fg: "#2C7BE5" },
  purple: { bg: "#F1EBFF", fg: "#6C5CE7" },
  green: { bg: "#E6F4EA", fg: "#1F8B4C" },
  pink: { bg: "#FFE6EA", fg: "#D03B5C" },
  peach: { bg: "#FFE9D9", fg: "#C9531A" },
  orange: { bg: "#FFE4D2", fg: "#E8620A" },
} as const;

export type TintKey = keyof typeof TINTS;

/* ─── Size variants ────────────────────────────────────────────────────────
   sm  w-10 h-10  — compact rows / dense lists
   md  w-11 h-11  — default (homepage quick-actions standard)
   lg  w-12 h-12  — larger rows (journal sheets, documents)               */
const SIZE: Record<"sm" | "md" | "lg", { cls: string; iconSize: number; labelSize: string }> = {
  sm: { cls: "w-10 h-10 rounded-[10px]", iconSize: 18, labelSize: "text-[7px]" },
  md: { cls: "w-11 h-11 rounded-[12px]", iconSize: 20, labelSize: "text-[8px]" },
  lg: { cls: "w-12 h-12 rounded-[14px]", iconSize: 22, labelSize: "text-[8px]" },
};

export interface GlyphTileProps {
  icon: ElementType;
  tint: TintKey;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Optional short text label shown below the icon (e.g. file extension). */
  label?: string;
  className?: string;
}

export function GlyphTile({ icon: Icon, tint, size = "md", label, className }: GlyphTileProps) {
  const { bg, fg } = TINTS[tint];
  const { cls, iconSize, labelSize } = SIZE[size];

  return (
    <div
      className={`${cls} flex-shrink-0 flex flex-col items-center justify-center${className ? ` ${className}` : ""}`}
      style={{ background: bg }}
    >
      <Icon size={iconSize} strokeWidth={2} style={{ color: fg }} />
      {label && (
        <span className={`${labelSize} font-bold leading-none mt-0.5`} style={{ color: fg }}>
          {label}
        </span>
      )}
    </div>
  );
}
