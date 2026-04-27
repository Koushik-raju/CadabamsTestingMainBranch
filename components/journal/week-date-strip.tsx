/**
 * FILE: components/journal/week-date-strip.tsx
 *
 * PURPOSE:
 *   Reusable 7-day date strip with week navigation, used on both the home
 *   journal page and the sub-journal detail page.
 *
 * LOGIC OVERVIEW:
 *   Renders a week navigation row (prev/next arrows + label) and 7 day buttons.
 *   Each day shows: narrow weekday letter, day number circle (highlighted when
 *   selected), and a dot indicator when that day has at least one entry.
 *   The parent owns all state (selectedDate, weekOffset); this component is
 *   purely presentational.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   WeekDay            — { dateStr, dayLetter, dayNum, hasEntries }
 *   WeekDateStripProps — full prop contract
 *   WeekDateStrip      — stateless presentational component
 *
 * DEPENDENCIES:
 *   lucide-react, cn (lib/utils)
 *
 * LAST UPDATED: 2026-04-27 — created; extracted from home page; used on home + slug detail pages
 */
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface WeekDay {
  dateStr: string;
  dayLetter: string;
  dayNum: number;
  hasEntries: boolean;
}

export interface WeekDateStripProps {
  days: WeekDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
  weekLabel: string;
  canGoForward: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeekDateStrip({
  days,
  selectedDate,
  onSelect,
  weekLabel,
  canGoForward,
  onPrevWeek,
  onNextWeek,
}: WeekDateStripProps) {
  return (
    <>
      {/* Week navigation row */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={onPrevWeek}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground font-medium">{weekLabel}</span>
        <button
          onClick={onNextWeek}
          className={cn(
            "p-1 rounded-lg transition-colors",
            canGoForward ? "hover:bg-muted" : "opacity-30 pointer-events-none",
          )}
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day buttons */}
      <div className="flex items-center justify-between gap-1 mb-4">
        {days.map(({ dateStr, dayLetter, dayNum, hasEntries }) => {
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className="flex-1 flex flex-col items-center gap-1 py-1 transition-colors"
            >
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isSelected ? "text-primary" : "text-muted-foreground",
                )}
              >
                {dayLetter}
              </span>
              <span
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {dayNum}
              </span>
              <span
                className={cn(
                  "w-1 h-1 rounded-full transition-opacity",
                  hasEntries ? "bg-primary opacity-100" : "opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
