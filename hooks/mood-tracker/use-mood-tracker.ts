/**
 * FILE: hooks/mood-tracker/use-mood-tracker.ts
 *
 * PURPOSE:
 *   SWR hooks + action helpers for the standalone Mood Tracker feature.
 *   Fetches the CMS assessment that drives the form (smiley Q1 + bubble Q2),
 *   posts new mood entries, and reads aggregate report data.
 *
 * LOGIC OVERVIEW:
 *   1. MOOD_TRACKER_CMS_ASSESSMENT_ID — the CmsAssessment whose questions
 *      power the form. Sourced from the live data (per the user's reference
 *      URL `?id=avym73d4x6258t3ligurl56r`). Override via NEXT_PUBLIC_
 *      MOOD_TRACKER_ASSESSMENT_ID at build time.
 *   2. useMoodTrackerAssessment — wraps useAssessmentById and extracts the
 *      first question's smiley list and the second question's bubble options.
 *   3. useMoodEntries(limit) — lists recent mood entries (newest first).
 *   4. useMoodReport(window) — aggregate metrics for the analyse screen.
 *   5. submitMoodEntry — POSTs a new MoodEntry; the SDK method may not exist
 *      yet (it's added by the backend regeneration step) so this calls the
 *      configured axios client directly with the typed body / response.
 *
 * KEY VARIABLES / EXPORTS:
 *   MOOD_TRACKER_CMS_ASSESSMENT_ID, MoodEntry, MoodTrackerReport,
 *   useMoodTrackerAssessment, useMoodEntries, useMoodReport, submitMoodEntry.
 *
 * DEPENDENCIES:
 *   swr, apiClient (axios with auth), useAssessmentById.
 *
 * LAST UPDATED: 2026-04-28 — initial creation.
 */
import { apiClient } from "@/api/backend-v2";
import { useAssessmentById } from "@/hooks/assessments/use-assessment-detail";
import useSWR from "swr";

const CAMPUS = "cadabams";

export const MOOD_TRACKER_CMS_ASSESSMENT_ID =
  process.env.NEXT_PUBLIC_MOOD_TRACKER_ASSESSMENT_ID ?? "avym73d4x6258t3ligurl56r";

export interface MoodEntry {
  id: string;
  crmLeadId: string | null;
  patientRef: string | null;
  campus: string;
  moodScore: number;
  moodLabel: string | null;
  feelings: string[];
  note: string | null;
  cmsAssessmentId: string | null;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntryListResponse {
  items: MoodEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface MoodTrackerReport {
  count: number;
  averageScore: number | null;
  scoreBuckets: Record<string, number>;
  topFeelings: { label: string; count: number }[];
  from?: string;
  to?: string;
}

export interface CreateMoodEntryBody {
  moodScore: number;
  moodLabel?: string;
  feelings?: string[];
  note?: string;
  cmsAssessmentId?: string;
  loggedAt?: string;
}

/* Q1 = smiley list, Q2 = bubble options. We rely on order from CMS rather
 * than the question component name because the CmsAssessmentQuestion table
 * uses Strapi-style polymorphic `__component` strings that differ across
 * deployments. */
export function useMoodTrackerAssessment() {
  const { data, isLoading, error } = useAssessmentById(MOOD_TRACKER_CMS_ASSESSMENT_ID);
  const questions = (data?.Questions ?? []).slice().sort((a, b) => a.order - b.order);
  const q1 = questions[0];
  const q2 = questions[1];
  return {
    assessment: data,
    isLoading,
    error,
    smileyQuestion: q1,
    bubbleQuestion: q2,
  };
}

export function useMoodEntries(limit = 30) {
  return useSWR<MoodEntryListResponse>(["mood-tracker", "list", limit], async () => {
    const res = await apiClient.get<MoodEntryListResponse>(`/api/v1/${CAMPUS}/mood-tracker`, {
      params: { limit },
    });
    return res.data;
  });
}

export function useMoodReport(from?: string, to?: string) {
  return useSWR<MoodTrackerReport>(["mood-tracker", "report", from ?? "", to ?? ""], async () => {
    const res = await apiClient.get<MoodTrackerReport>(`/api/v1/${CAMPUS}/mood-tracker/report`, {
      params: { from, to },
    });
    return res.data;
  });
}

export async function submitMoodEntry(body: CreateMoodEntryBody): Promise<MoodEntry> {
  const res = await apiClient.post<MoodEntry>(`/api/v1/${CAMPUS}/mood-tracker`, {
    cmsAssessmentId: MOOD_TRACKER_CMS_ASSESSMENT_ID,
    ...body,
  });
  return res.data;
}
