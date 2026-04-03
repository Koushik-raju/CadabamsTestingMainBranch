'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimeSlotItem {
  id: string | number;
  slot?: string;
  time?: string;
  display_time?: string;
  availability?: boolean | string;
}

interface TimeSlotPickerProps {
  slots: TimeSlotItem[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  loading?: boolean;
}

export function TimeSlotPicker({ slots, selectedId, onSelect, loading }: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-11 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <Clock className="h-8 w-8" />
        <p className="text-sm">No slots available for this date</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slots.map((slot) => {
        const label = slot.display_time ?? slot.slot ?? slot.time ?? 'N/A';
        const isSelected = slot.id === selectedId;
        const isAvailable =
          slot.availability === true ||
          slot.availability === 'available' ||
          slot.availability === undefined;

        return (
          <button
            key={slot.id}
            type="button"
            disabled={!isAvailable}
            onClick={() => onSelect(slot.id)}
            aria-pressed={isSelected}
            aria-label={`Select time slot ${label}`}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : isAvailable
                ? 'border-border bg-card text-foreground hover:border-primary/50'
                : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
