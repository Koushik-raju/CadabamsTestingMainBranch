import { apiClient } from "@/api/backend-v2";
import { growthDayKey, growthWeekKey } from "@/lib/swr-keys";
/**
 * FILE: hooks/growth/use-growth.ts
 *
 * PURPOSE:
 *   SWR hooks for the Growth page — weekly calendar dots and per-day
 *   aggregated feed (journeys, journals, assessments, chat summaries).
 *   Uses the shared apiClient so auth + refresh interceptors apply.
 *
 * LOGIC OVERVIEW:
 *   Types mirror the backend DTOs in src/modules/growth/dto/*. Calls are
 *   hand-rolled against /api/v1/me/growth/{week,day}. When the backend-v2
 *   SDK is regenerated these can be swapped for the generated functions
 *   without touching consumers (hook shape is the contract).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   useGrowthWeek(date)  — Mon→Sun flags for the week containing `date`
 *   useGrowthDay(date)   — merged feed for `date`
 *   todayIso()           — shared default-date helper
 *
 * DEPENDENCIES:
 *   apiClient (api/backend-v2), SWR, swr-keys
 *
 * LAST UPDATED: 2026-04-23 — initial scaffold
 */
import useSWR from "swr";

export interface GrowthWeekDay {
  date: string;
  hasJourney: boolean;
  hasJournal: boolean;
  hasAssessment: boolean;
  hasChatSummary: boolean;
}

export interface GrowthWeek {
  weekStart: string;
  weekEnd: string;
  days: GrowthWeekDay[];
}

export interface GrowthJourneyItem {
  /** 'day' = full-day completion with LLM summary; 'task' = individual task (mood/journal/audio/etc.) completed inside a journey. */
  kind: 'day' | 'task';
  enrollmentId: string;
  journeyId: string;
  journeyTitle: string | null;
  dayNumber: number | null;
  /** Only populated when kind='day'. */
  summaryText: string | null;
  /** Only populated when kind='task'. */
  taskTitle: string | null;
  /** Only populated when kind='task'. CmsJourneyStepTask.kind enum value. */
  taskType: string | null;
  completedAt: string;
}

export interface GrowthJournalItem {
  id: string;
  title: string | null;
  entryText: string | null;
  journaledAt: string;
  subJournalingId: string | null;
}

export interface GrowthAssessmentItem {
  id: string;
  assessmentKey: string;
  assessmentTitle: string | null;
  severity: string | null;
  analysisMarkdown: string | null;
  completedAt: string;
}

export interface GrowthChatSummaryItem {
  id: string;
  text: string;
  createdAt: string;
}

export interface GrowthDay {
  date: string;
  journeys: GrowthJourneyItem[];
  journals: GrowthJournalItem[];
  assessments: GrowthAssessmentItem[];
  chatSummaries: GrowthChatSummaryItem[];
}

export interface GrowthLatestActiveDate {
  date: string | null;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchLatestActiveDate(): Promise<GrowthLatestActiveDate> {
  const { data } = await apiClient.get<GrowthLatestActiveDate>(
    "/api/v1/me/growth/latest-active-date",
  );
  return data;
}

/**
 * Returns the patient's most-recent activity date across all four Growth
 * sources. Falls back to `null` when the user has no data. Consumers use
 * this to seed default calendar selection — otherwise long-dormant users
 * land on an empty "today" view and assume the page is broken.
 */
export function useGrowthLatestActiveDate() {
  const { data, error, isLoading } = useSWR<GrowthLatestActiveDate>(
    "growth-latest-active-date",
    fetchLatestActiveDate,
    { revalidateOnFocus: false },
  );
  return { latest: data?.date ?? null, error, isLoading };
}

async function fetchWeek(date: string): Promise<GrowthWeek> {
  const { data } = await apiClient.get<GrowthWeek>("/api/v1/me/growth/week", {
    params: { date },
  });
  return data;
}

async function fetchDay(date: string): Promise<GrowthDay> {
  const { data } = await apiClient.get<GrowthDay>("/api/v1/me/growth/day", {
    params: { date },
  });
  return data;
}

export function useGrowthWeek(date: string) {
  const { data, error, isLoading, mutate } = useSWR<GrowthWeek>(
    growthWeekKey(date),
    () => fetchWeek(date),
    { revalidateOnFocus: false },
  );
  return { week: data, error, isLoading, refresh: mutate };
}

export function useGrowthDay(date: string) {
  const { data, error, isLoading, mutate } = useSWR<GrowthDay>(
    growthDayKey(date),
    () => fetchDay(date),
    { revalidateOnFocus: false },
  );
  return { day: data, error, isLoading, refresh: mutate };
}
