"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";

export interface DotOption {
  id?: string | number;
  label: string;
  value?: string;
}

interface DotChooserProps {
  title?: string;
  subTitle?: string;
  options: DotOption[];
  selected: string[];
  maxSlots?: number;
  onToggle: (value: string) => void;
}

export function DotChooser({
  title,
  subTitle,
  options,
  selected,
  maxSlots = 3,
  onToggle,
}: DotChooserProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const slots = Array.from({ length: maxSlots }, (_, i) => selected[i] || null);
  const availableOptions = options.filter((o) => !selected.includes(o.value || o.label));

  const handleSlotClick = (index: number) => {
    if (slots[index]) {
      // Remove this selection
      onToggle(slots[index]!);
    } else {
      // Open picker to add
      setReplaceIndex(index);
      setSheetOpen(true);
    }
  };

  const handlePick = (value: string) => {
    // If replacing an existing slot, remove old value first
    if (replaceIndex !== null && slots[replaceIndex]) {
      onToggle(slots[replaceIndex]!);
    }
    onToggle(value);
    setSheetOpen(false);
    setReplaceIndex(null);
  };

  return (
    <div className="flex flex-col px-5 pt-6 pb-4 w-full">
      {subTitle && (
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          {subTitle}
        </p>
      )}
      {title && <h2 className="text-xl font-bold text-foreground mb-2 leading-snug">{title}</h2>}
      <p className="text-sm text-muted-foreground mb-6">
        Selected {selected.length} of {maxSlots}
      </p>

      {/* Slots display */}
      <div className="flex gap-4 justify-center mb-6">
        {slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => handleSlotClick(i)}
            className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-95 ${
              slot
                ? "border-primary bg-primary/10"
                : "border-dashed border-border bg-card hover:border-primary/30"
            }`}
          >
            {slot ? (
              <span className="text-xs font-medium text-primary text-center px-1 leading-tight">
                {slot}
              </span>
            ) : (
              <Plus className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Option picker sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && setSheetOpen(false)}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base font-semibold">Choose an option</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {availableOptions.map((opt, index) => {
              const val = opt.value || opt.label;
              return (
                <button
                  key={opt.id ?? index}
                  onClick={() => handlePick(val)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground/30" />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
