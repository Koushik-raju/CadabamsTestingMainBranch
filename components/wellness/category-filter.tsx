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
