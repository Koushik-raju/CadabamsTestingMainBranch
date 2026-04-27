/**
 * FILE: lib/journal-utils.ts
 *
 * PURPOSE:
 *   Shared date utilities for journal pages (home, sub-journal detail, [date]).
 *
 * LOGIC OVERVIEW:
 *   toLocalDateStr   — converts a Date to "YYYY-MM-DD" using local timezone, not UTC.
 *   buildWeekBaseDays — builds the 7-day window (oldest → newest) for a given week
 *     offset. Callers merge the result with a hasEntries flag from their entry set.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   toLocalDateStr(d)            — "2026-04-27" in local time
 *   buildWeekBaseDays(offset)    — array of 7 { dateStr, dayLetter, dayNum } objects
 *
 * DEPENDENCIES: none
 *
 * LAST UPDATED: 2026-04-27 — created; extracted from home page to avoid duplication
 */

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface WeekBaseDay {
  dateStr: string;
  dayLetter: string;
  dayNum: number;
}

/** Returns 7 days ending at today - offsetDays, from oldest to newest. */
export function buildWeekBaseDays(offsetDays: number): WeekBaseDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offsetDays - (6 - i));
    return {
      dateStr: toLocalDateStr(d),
      dayLetter: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      dayNum: d.getDate(),
    };
  });
}
