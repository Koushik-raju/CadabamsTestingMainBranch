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
                ? "bg-foreground border-foreground text-background shadow-sm"
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
