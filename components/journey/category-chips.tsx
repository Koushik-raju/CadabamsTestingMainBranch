/**
 * FILE: components/journey/category-chips.tsx
 *
 * PURPOSE:
 *   Horizontal scrollable chip filter for journey categories. Shows active/inactive
 *   state with visual distinction. Includes a fade gradient on the right to mask
 *   overflow.
 *
 * LOGIC OVERVIEW:
 *   Renders a list of category buttons in a flex row with overflow-auto. Active
 *   button has contrasting foreground/background colors. Inactive buttons have
 *   border + muted text. Gradient overlay on right prevents text from being cut off
 *   by scroll edge.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   categories   — array of category string labels
 *   active       — currently selected category string
 *   onChange     — callback fired with selected category
 *   CategoryChips — default export component
 *
 * DEPENDENCIES:
 *   lib/utils: cn for classname merging
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

export function CategoryChips({ categories, active, onChange }: CategoryChipsProps) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto px-4 py-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "px-4 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border",
              active === cat
                ? "bg-foreground border-foreground text-background shadow-[var(--sh-1)]"
                : "bg-card border-border text-muted-foreground hover:border-foreground/30",
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
