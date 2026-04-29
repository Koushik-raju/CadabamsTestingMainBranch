/**
 * FILE: components/wellness/category-filter.tsx
 *
 * PURPOSE:
 *   Horizontal scrollable filter chip component for filtering wellness sessions by category.
 *   Renders a row of category buttons with active state styling.
 *
 * LOGIC OVERVIEW:
 *   Maps category list into pill buttons. Highlights selected category with primary color.
 *   Wrapped in ScrollArea for overflow handling. Each click fires onSelect callback.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   categories  — array of category names to render as chips
 *   selected    — currently selected category name
 *   onSelect    — callback fired when user clicks a category chip
 *
 * DEPENDENCIES:
 *   ScrollArea  — shadcn/ui scroll area primitive
 *   cn          — tailwind class merge utility
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */

"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="relative">
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1 pr-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-all",
                selected === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
