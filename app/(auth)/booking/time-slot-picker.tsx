'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimeSlot } from '@/sdk/auth-and-crm';

function formatSlotTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading?: boolean;
}

export function TimeSlotPicker({ slots, selectedId, onSelect, loading }: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
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
        const label = formatSlotTime(slot.start_datetime);
        const isSelected = slot.id === selectedId;

        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onSelect(slot.id)}
            aria-pressed={isSelected}
            aria-label={`Select time slot ${label}`}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:border-primary/50'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
