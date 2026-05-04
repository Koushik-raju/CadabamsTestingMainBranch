/**
 * FILE: hooks/sleep-tracker/use-sleep-tracker.ts
 *
 * PURPOSE:
 *   SWR hooks + action helpers for the standalone Sleep Tracker feature.
 *   Fetches the CMS assessment that drives the form (Q1 score scale + Q2
 *   bubble factors), posts new sleep entries, and reads aggregate report data.
 *
 * LOGIC OVERVIEW:
 *   1. SLEEP_TRACKER_CMS_ASSESSMENT_ID — the CmsAssessment whose questions
 *      power the form. Sourced from the live data (per the user's reference
 *      URL `/assessments/qgyyj84i2uosz0fm8ymmstcj`). Override via NEXT_PUBLIC_
 *      SLEEP_TRACKER_ASSESSMENT_ID at build time.
 *   2. useSleepTrackerAssessment — wraps useAssessmentById and extracts the
 *      first question's score list and the second question's bubble options.
 *   3. useSleepEntries(limit) — lists recent sleep entries (newest first) via
 *      sleepTrackerControllerList SDK function.
 *   4. useSleepReport(from, to) — aggregate metrics via sleepTrackerControllerReport.
 *   5. submitSleepEntry — POSTs a new entry via sleepTrackerControllerCreate.
 *
 * KEY VARIABLES / EXPORTS:
 *   SLEEP_TRACKER_CMS_ASSESSMENT_ID, SleepEntryResponseDto, SleepEntryListResponseDto,
 *   SleepTrackerReportDto, CreateSleepEntryDto,
 *   useSleepTrackerAssessment, useSleepEntries, useSleepReport, submitSleepEntry.
 *
 * DEPENDENCIES:
 *   sleepTrackerControllerList / Create / Report (sdk)
 *   useAssessmentById (hooks/assessments/use-assessment-detail)
 *   SWR (useSWR)
 *
 * LAST UPDATED: 2026-04-29 — initial creation (cloned from mood-tracker hook).
 */

import useSWR from "swr";
import { useAssessmentById } from "@/hooks/assessments/use-assessment-detail";
import {
  type CreateSleepEntryDto,
  type SleepEntryListResponseDto,
  type SleepEntryResponseDto,
  type SleepTrackerReportDto,
  sleepTrackerControllerCreate,
  sleepTrackerControllerList,
  sleepTrackerControllerReport,
} from "@/sdk/backend-v2";

export type {
  CreateSleepEntryDto,
  SleepEntryListResponseDto,
  SleepEntryResponseDto,
  SleepTrackerReportDto,
};

const CAMPUS = "cadabams";

export const SLEEP_TRACKER_CMS_ASSESSMENT_ID =
  process.env.NEXT_PUBLIC_SLEEP_TRACKER_ASSESSMENT_ID ?? "qgyyj84i2uosz0fm8ymmstcj";

/* Q1 = 1–5 score, Q2 = bubble factors. We rely on order from CMS rather
 * than the question component name because the CmsAssessmentQuestion table
 * uses Strapi-style polymorphic `__component` strings that differ across
 * deployments. */
export function useSleepTrackerAssessment() {
  const { data, isLoading, error } = useAssessmentById(SLEEP_TRACKER_CMS_ASSESSMENT_ID);
  const questions = (data?.Questions ?? []).slice().sort((a, b) => a.order - b.order);
  const q1 = questions[0];
  const q2 = questions[1];
  return {
    assessment: data,
    isLoading,
    error,
    scoreQuestion: q1,
    bubbleQuestion: q2,
  };
}

export function useSleepEntries(limit = 30) {
  return useSWR<SleepEntryListResponseDto>(["sleep-tracker", "list", limit], async () => {
    const res = await sleepTrackerControllerList({
      path: { campus: CAMPUS },
      query: { limit },
    });
    if (res.error) throw new Error(JSON.stringify(res.error));
    return res.data as SleepEntryListResponseDto;
  });
}

export function useSleepReport(from?: string, to?: string) {
  return useSWR<SleepTrackerReportDto>(
    ["sleep-tracker", "report", from ?? "", to ?? ""],
    async () => {
      const res = await sleepTrackerControllerReport({
        path: { campus: CAMPUS },
        query: { from, to },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data as SleepTrackerReportDto;
    },
  );
}

export async function submitSleepEntry(body: CreateSleepEntryDto): Promise<SleepEntryResponseDto> {
  const res = await sleepTrackerControllerCreate({
    path: { campus: CAMPUS },
    body: { cmsAssessmentId: SLEEP_TRACKER_CMS_ASSESSMENT_ID, ...body },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  return res.data as SleepEntryResponseDto;
}
