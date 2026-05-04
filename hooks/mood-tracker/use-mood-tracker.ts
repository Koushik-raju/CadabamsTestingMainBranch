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
 *   3. useMoodEntries(limit) — lists recent mood entries (newest first) via
 *      moodTrackerControllerList SDK function.
 *   4. useMoodReport(from, to) — aggregate metrics via moodTrackerControllerReport.
 *   5. submitMoodEntry — POSTs a new entry via moodTrackerControllerCreate.
 *
 * KEY VARIABLES / EXPORTS:
 *   MOOD_TRACKER_CMS_ASSESSMENT_ID, MoodEntryResponseDto, MoodEntryListResponseDto,
 *   MoodTrackerReportDto, CreateMoodEntryDto,
 *   useMoodTrackerAssessment, useMoodEntries, useMoodReport, submitMoodEntry.
 *
 * DEPENDENCIES:
 *   moodTrackerControllerList / Create / Report (sdk)
 *   useAssessmentById (hooks/assessments/use-assessment-detail)
 *   SWR (useSWR)
 *
 * LAST UPDATED: 2026-04-28 — replaced apiClient axios calls with SDK functions;
 *   removed custom types in favour of SDK types.
 */

import useSWR from "swr";
import { useAssessmentById } from "@/hooks/assessments/use-assessment-detail";
import {
  type CreateMoodEntryDto,
  type MoodEntryListResponseDto,
  type MoodEntryResponseDto,
  type MoodTrackerReportDto,
  moodTrackerControllerCreate,
  moodTrackerControllerList,
  moodTrackerControllerReport,
} from "@/sdk/backend-v2";

export type {
  CreateMoodEntryDto,
  MoodEntryListResponseDto,
  MoodEntryResponseDto,
  MoodTrackerReportDto,
};

const CAMPUS = "cadabams";

export const MOOD_TRACKER_CMS_ASSESSMENT_ID =
  process.env.NEXT_PUBLIC_MOOD_TRACKER_ASSESSMENT_ID ?? "avym73d4x6258t3ligurl56r";

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
  return useSWR<MoodEntryListResponseDto>(["mood-tracker", "list", limit], async () => {
    const res = await moodTrackerControllerList({
      path: { campus: CAMPUS },
      query: { limit },
    });
    if (res.error) throw new Error(JSON.stringify(res.error));
    return res.data as MoodEntryListResponseDto;
  });
}

export function useMoodReport(from?: string, to?: string) {
  return useSWR<MoodTrackerReportDto>(
    ["mood-tracker", "report", from ?? "", to ?? ""],
    async () => {
      const res = await moodTrackerControllerReport({
        path: { campus: CAMPUS },
        query: { from, to },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data as MoodTrackerReportDto;
    },
  );
}

export async function submitMoodEntry(body: CreateMoodEntryDto): Promise<MoodEntryResponseDto> {
  const res = await moodTrackerControllerCreate({
    path: { campus: CAMPUS },
    body: { cmsAssessmentId: MOOD_TRACKER_CMS_ASSESSMENT_ID, ...body },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  return res.data as MoodEntryResponseDto;
}
