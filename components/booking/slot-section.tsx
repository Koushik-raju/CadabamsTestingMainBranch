'use client';

import { cn } from '@/lib/utils';
import type { SlotResponseDto as TimeSlot } from '@/sdk/backend-v2';

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

interface SlotSectionProps {
  title: string;
  slots: TimeSlot[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function SlotSection({ title, slots, selectedId, onSelect }: SlotSectionProps) {
  if (slots.length === 0) return null;

  // Pad last row to complete a 3-column grid
  const padCount = slots.length % 3 === 0 ? 0 : 3 - (slots.length % 3);

  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs text-muted-foreground font-medium mb-2">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const isSelected = slot.id === selectedId;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelect(slot.id)}
              aria-pressed={isSelected}
              className={cn(
                'h-10 rounded-xl text-xs font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-white text-foreground hover:border-primary/40',
              )}
            >
              {formatTime(slot.start_datetime)}
            </button>
          );
        })}
        {Array.from({ length: padCount }).map((_, i) => (
          <div
            key={`pad-${i}`}
            className="h-10 flex items-center justify-center"
          >
            <span className="text-xs text-muted-foreground">No slots</span>
          </div>
        ))}
      </div>
    </div>
  );
}
