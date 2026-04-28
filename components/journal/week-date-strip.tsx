/**
 * FILE: components/journal/week-date-strip.tsx
 *
 * PURPOSE:
 *   Reusable 7-day date strip with week navigation, used on both the home
 *   journal page and the sub-journal detail page.
 *
 * LOGIC OVERVIEW:
 *   Renders a week navigation row (prev/next arrows + label) and 7 day buttons.
 *   Each day shows: narrow weekday letter, day number circle (orange filled when
 *   selected), and an orange dot indicator when that day has at least one entry.
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
 * LAST UPDATED: 2026-04-28 — Design system migration: orange selected state (#F97316),
 *   removed Tailwind semantic color tokens in favour of exact design-system hex values
 */
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
          className="p-1 rounded-[10px] hover:bg-[#F4F2EE] transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
        <span className="text-[12px] font-medium" style={{ color: "#6B7280" }}>
          {weekLabel}
        </span>
        <button
          onClick={onNextWeek}
          className={[
            "p-1 rounded-[10px] transition-colors",
            canGoForward ? "hover:bg-[#F4F2EE]" : "opacity-30 pointer-events-none",
          ].join(" ")}
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Day buttons — active day = orange filled circle (squircle pattern) */}
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
                className="text-[11px] font-semibold"
                style={{ color: isSelected ? "#F97316" : "#6B7280" }}
              >
                {dayLetter}
              </span>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors mt-numeric"
                style={{
                  background: isSelected ? "#F97316" : "transparent",
                  color: isSelected ? "#fff" : "#0E1726",
                }}
              >
                {dayNum}
              </span>
              {/* Entry indicator dot */}
              <span
                className="w-1 h-1 rounded-full transition-opacity"
                style={{ background: hasEntries ? "#F97316" : "transparent" }}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
