"use client";

import { CheckCircle, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface JourneyDayItem {
  dayNumber: number;
  unlocked: boolean;
  available: boolean;
  completed: boolean;
  date?: string;
  title?: string;
}

interface JourneyDayListProps {
  days: JourneyDayItem[];
  onDayClick?: (day: JourneyDayItem) => void;
  currentDay?: number;
}

export function JourneyDayList({ days, onDayClick, currentDay }: JourneyDayListProps) {
  return (
    <div className="flex flex-col gap-2">
      {days.map((day) => {
        const isActive = day.dayNumber === currentDay;
        const isClickable = day.unlocked || day.available;

        return (
          <button
            key={day.dayNumber}
            disabled={!isClickable}
            onClick={() => isClickable && onDayClick?.(day)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
              day.completed
                ? "bg-primary/10 border border-primary/20"
                : day.unlocked || day.available
                  ? "bg-card border border-primary hover:bg-accent"
                  : "bg-muted border border-transparent opacity-60 cursor-not-allowed",
              isActive && "ring-2 ring-primary ring-offset-1",
            )}
          >
            {/* Day icon */}
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                day.completed
                  ? "bg-primary text-primary-foreground"
                  : day.unlocked || day.available
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/20 text-muted-foreground",
              )}
            >
              {day.completed ? (
                <CheckCircle className="w-4 h-4" />
              ) : day.unlocked || day.available ? (
                <Play className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>

            {/* Day info */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-semibold text-sm",
                  day.completed
                    ? "text-primary"
                    : day.unlocked || day.available
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {day.title ?? `Day ${day.dayNumber}`}
              </p>
              {day.date && <p className="text-xs text-muted-foreground mt-0.5">{day.date}</p>}
            </div>

            {/* Status badge */}
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                day.completed
                  ? "bg-primary/20 text-primary"
                  : day.unlocked || day.available
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {day.completed ? "Done" : day.unlocked || day.available ? "Start" : "Locked"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
