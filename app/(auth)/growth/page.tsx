/**
 * FILE: app/(auth)/growth/page.tsx
 *
 * PURPOSE:
 *   Growth reflection hub. Weekly Mon→Sun calendar with activity dots +
 *   per-day aggregated feed (journey day completions + LLM summaries,
 *   journal entries, assessments with markdown analyses, chat summaries).
 *   Tapping any feed row opens a shared markdown modal.
 *
 * LOGIC OVERVIEW:
 *   1. `selectedDate` (ISO, default today) drives both `useGrowthDay` and
 *      which cell is highlighted.
 *   2. `weekAnchor` (any ISO date within the displayed week) drives
 *      `useGrowthWeek`. Previous/next week shifts the anchor by ±7 days.
 *   3. `handleNavigateWeek` also jumps `selectedDate` to the first day of
 *      the new week when the current selection is no longer visible.
 *   4. `modal` holds the current row's { title, subtitle, body }; a single
 *      MarkdownModal is shared across all four sections to keep the state
 *      surface small.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   Default-export GrowthPage — Next.js App Router page component.
 *
 * DEPENDENCIES:
 *   useGrowthWeek, useGrowthDay (hooks/growth/use-growth)
 *   WeeklyCalendar, DayFeed, MarkdownModal (components/growth/*)
 *   PageHeader (components/shared/navigation/page-header)
 *
 * LAST UPDATED: 2026-04-23 — initial implementation
 */
"use client";

import { useSearchParams } from "next/navigation";
import { DayFeed, type ModalPayload } from "@/components/growth/day-feed";
import { MarkdownModal } from "@/components/growth/markdown-modal";
import { WeeklyCalendar } from "@/components/growth/weekly-calendar";
import { PageHeader } from "@/components/shared/navigation/page-header";
import {
  todayIso,
  useGrowthDay,
  useGrowthLatestActiveDate,
  useGrowthWeek,
} from "@/hooks/growth/use-growth";
import { useEffect, useRef, useState } from "react";

function shiftIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function GrowthPage() {
  const today = todayIso();
  const searchParams = useSearchParams();
  // `?date=YYYY-MM-DD` lets external callers (the home widget, deep links)
  // hand off a specific day and skip the auto-jump. Invalid values are
  // silently ignored so arbitrary query strings never break navigation.
  const dateParam = searchParams?.get('date') ?? null;
  const initialDate = dateParam && ISO_DATE_RE.test(dateParam) ? dateParam : today;

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [weekAnchor, setWeekAnchor] = useState<string>(initialDate);
  const [modal, setModal] = useState<ModalPayload | null>(null);

  // First-load auto-jump: only runs when the caller did NOT pass ?date=.
  // If today has no activity but the user has data elsewhere in their
  // history, snap both the selection and the calendar anchor to the
  // best default date. The ref gates this to a single run so the user's
  // manual navigation is never overridden.
  const { latest } = useGrowthLatestActiveDate();
  const autoJumpedRef = useRef(false);
  useEffect(() => {
    if (autoJumpedRef.current) return;
    if (dateParam && ISO_DATE_RE.test(dateParam)) {
      autoJumpedRef.current = true;
      return;
    }
    if (!latest) return;
    if (latest === today) {
      autoJumpedRef.current = true;
      return;
    }
    autoJumpedRef.current = true;
    setSelectedDate(latest);
    setWeekAnchor(latest);
  }, [latest, today, dateParam]);

  const { week, isLoading: weekLoading } = useGrowthWeek(weekAnchor);
  const { day, isLoading: dayLoading } = useGrowthDay(selectedDate);

  const handleNavigateWeek = (delta: -1 | 1) => {
    const nextAnchor = shiftIso(weekAnchor, delta * 7);
    setWeekAnchor(nextAnchor);
    // When paging weeks, snap selection to Monday of the new week so the
    // feed matches what the calendar is showing.
    setSelectedDate(nextAnchor);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Growth" subtitle="Your reflection timeline" fallback="/home" />

      <div className="bg-card border-b border-border">
        <WeeklyCalendar
          week={week}
          selectedDate={selectedDate}
          isLoading={weekLoading}
          onSelect={setSelectedDate}
          onNavigateWeek={handleNavigateWeek}
        />
      </div>

      <div className="pt-4">
        <DayFeed day={day} isLoading={dayLoading} onOpenItem={(payload) => setModal(payload)} />
      </div>

      <MarkdownModal
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        title={modal?.title ?? ""}
        subtitle={modal?.subtitle}
        body={modal?.body ?? null}
      />
    </div>
  );
}
