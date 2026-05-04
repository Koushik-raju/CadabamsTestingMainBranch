/**
 * FILE: hooks/baseline-assessment/use-baseline-assessment.ts
 *
 * PURPOSE:
 *   SWR hooks for the baseline assessment module — reads and mutates the
 *   current patient's onboarding intake records via the backend SDK.
 *
 * LOGIC OVERVIEW:
 *   useMyBaselineAssessments — fetches the list of all baseline assessment
 *     records for the authenticated user via GET /me/baseline-assessment.
 *     Returns the array directly (API returns BaselineAssessmentDto[]).
 *   useMyLatestBaselineAssessment — convenience wrapper over the list hook
 *     that picks the most recent record (createdAt descending).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   useMyBaselineAssessments        — returns { items, isLoading, error }
 *   useMyLatestBaselineAssessment   — returns { assessment, isLoading, error }
 *
 * DEPENDENCIES:
 *   baselineAssessmentMeControllerFindAllForUser — SDK function
 *   baselineAssessmentMyKey                      — SWR cache key
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

import useSWR from "swr";
import { baselineAssessmentMyKey } from "@/lib/swr-keys";
import type { BaselineAssessmentDto } from "@/sdk/backend-v2";
import { baselineAssessmentMeControllerFindAllForUser } from "@/sdk/backend-v2";

export function useMyBaselineAssessments() {
  const { data, error, isLoading, mutate } = useSWR(baselineAssessmentMyKey(), async () => {
    const res = await baselineAssessmentMeControllerFindAllForUser();
    if (res.error) throw new Error(JSON.stringify(res.error));
    return (res.data ?? []) as BaselineAssessmentDto[];
  });

  return {
    items: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useMyLatestBaselineAssessment() {
  const { items, isLoading, error } = useMyBaselineAssessments();

  /* Records are returned in createdAt-descending order from the API.
     The first item is the most recent assessment, if any. */
  const assessment = items.length > 0 ? items[0] : null;

  return { assessment, isLoading, error };
}
