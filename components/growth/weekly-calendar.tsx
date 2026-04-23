/**
 * FILE: components/growth/weekly-calendar.tsx
 *
 * PURPOSE:
 *   Horizontal Mon→Sun strip on the Growth page. Each cell is a date with
 *   a coloured dot when *any* source (journey, journal, assessment, chat
 *   summary) has activity that day. The selected cell is highlighted.
 *
 * LOGIC OVERVIEW:
 *   Receives the full GrowthWeek response + selectedDate + callbacks.
 *   Cells render in the week's order; `hasAny` derives whether to render
 *   a dot. Previous/next week buttons shift `weekStart` by 7 days via
 *   the parent's onNavigateWeek callback.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   week              — GrowthWeek (7 days Mon→Sun) or undefined while loading
 *   selectedDate      — ISO date currently selected
 *   onSelect(date)    — called when a cell is tapped
 *   onNavigateWeek(delta) — called with -1 (prev) or +1 (next)
 *
 * DEPENDENCIES:
 *   lucide-react icons, shadcn Button, cn utility
 *
 * LAST UPDATED: 2026-04-23 — initial scaffold
 */
"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { GrowthWeek, GrowthWeekDay } from "@/hooks/growth/use-growth";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function hasAny(d: GrowthWeekDay): boolean {
  return d.hasJourney || d.hasJournal || d.hasAssessment || d.hasChatSummary;
}

function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}

function formatRange(weekStart?: string, weekEnd?: string): string {
  if (!weekStart || !weekEnd) return "";
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(`${weekEnd}T00:00:00Z`);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)}`;
}

interface Props {
  week: GrowthWeek | undefined;
  selectedDate: string;
  isLoading: boolean;
  onSelect: (date: string) => void;
  onNavigateWeek: (delta: -1 | 1) => void;
}

export function WeeklyCalendar({ week, selectedDate, isLoading, onSelect, onNavigateWeek }: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigateWeek(-1)}
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-sm font-semibold text-foreground min-w-[140px] text-center">
          {formatRange(week?.weekStart, week?.weekEnd)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigateWeek(1)}
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {(isLoading || !week ? (Array.from({ length: 7 }) as undefined[]) : week.days).map(
          (day, i) => {
            const iso = day?.date;
            const isSelected = iso === selectedDate;
            const isToday = iso === todayIso;
            return (
              <button
                key={iso ?? i}
                type="button"
                onClick={() => iso && onSelect(iso)}
                disabled={!iso}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-xl transition-colors",
                  "active:bg-muted",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-primary/10 text-primary"
                      : "text-foreground",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {DOW_LABELS[i]}
                </span>
                {iso ? (
                  <span className="text-sm font-bold">{dayOfMonth(iso)}</span>
                ) : (
                  <Skeleton className="h-4 w-5" />
                )}
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    day && hasAny(day)
                      ? isSelected
                        ? "bg-primary-foreground"
                        : "bg-primary"
                      : "bg-transparent",
                  )}
                />
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
