/**
 * FILE: hooks/assessments/use-assessment-reports.ts
 *
 * PURPOSE:
 *   SWR hooks for the current patient's stored LLM analyses (reports) against a
 *   single assessment template, plus a helper for "latest completion + latest
 *   report" used by the result page and a regenerate action.
 *
 * LOGIC OVERVIEW:
 *   - fetchAssessmentData: fetches completions (filtered by assessmentKey) and
 *     analyses (filtered by assessmentKey via query param) in parallel. Backend
 *     returns both sets pre-filtered and completions sorted completedAt DESC.
 *     Joins analyses whose completionId belongs to the completion set; analyses
 *     sorted by createdAt DESC.
 *   - useAssessmentReports: returns the joined list sorted newest-first.
 *   - useLatestAssessmentResult: derives the latest completion and, if present,
 *     its matching analysis. Exposes a regenerate() that re-runs the analyze
 *     endpoint (which upserts the stored row) and revalidates the cache.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   useAssessmentReports(assessmentId)       — { reports, isLoading, error }
 *   useLatestAssessmentResult(assessmentId)  — { completion, report, regenerate,
 *                                                 isRegenerating, isLoading, error }
 *   AssessmentReport                          — AssessmentAnalysisDto + completion
 *
 * DEPENDENCIES:
 *   patientAssessmentsAnalysisControllerList      — SDK: list stored analyses (filtered by assessmentKey)
 *   patientAssessmentsAnalysisControllerAnalyze   — SDK: run/re-run analysis
 *   patientAssessmentsControllerListMine          — SDK: list patient's completions
 *   assessmentReportsKey                          — SWR cache key factory
 *
 * LAST UPDATED: 2026-04-21 — pass assessmentKey to analyses endpoint; remove
 *   client-side completion sort (backend returns completedAt DESC)
 */
import { useState } from "react";
import useSWR from "swr";
import { assessmentReportsKey } from "@/lib/swr-keys";
import type { AssessmentAnalysisDto, CompletionResponseDto } from "@/sdk/backend-v2";
import {
  patientAssessmentsAnalysisControllerAnalyze,
  patientAssessmentsAnalysisControllerList,
  patientAssessmentsControllerListMine,
} from "@/sdk/backend-v2";

export interface AssessmentReport extends AssessmentAnalysisDto {
  completion?: CompletionResponseDto;
}

interface AssessmentReportsData {
  reports: AssessmentReport[];
  completions: CompletionResponseDto[];
}

async function fetchAssessmentData(assessmentId: string): Promise<AssessmentReportsData> {
  const [completionsRes, analysesRes] = await Promise.all([
    patientAssessmentsControllerListMine({
      path: { campus: "cadabams" },
      query: { assessmentKey: assessmentId },
    }),
    patientAssessmentsAnalysisControllerList({
      query: { assessmentKey: assessmentId },
    }),
  ]);
  if (completionsRes.error) throw new Error(JSON.stringify(completionsRes.error));
  if (analysesRes.error) throw new Error(JSON.stringify(analysesRes.error));

  // Backend returns completions sorted completedAt DESC — no client sort needed
  const completions = completionsRes.data ?? [];
  const byId = new Map<string, CompletionResponseDto>(completions.map((c) => [c.id, c]));
  const analyses = analysesRes.data?.items ?? [];
  // Filter to analyses belonging to this assessment's completions, sort by createdAt DESC
  const reports: AssessmentReport[] = analyses
    .filter((a) => byId.has(a.completionId))
    .map((a) => ({ ...a, completion: byId.get(a.completionId) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { reports, completions };
}

export function useAssessmentReports(assessmentId: string | null) {
  const { data, isLoading, error } = useSWR(
    assessmentId ? assessmentReportsKey(assessmentId) : null,
    () => fetchAssessmentData(assessmentId!),
  );

  return { reports: data?.reports ?? [], isLoading, error };
}

export function useLatestAssessmentResult(assessmentId: string | null) {
  const { data, isLoading, error, mutate } = useSWR(
    assessmentId ? assessmentReportsKey(assessmentId) : null,
    () => fetchAssessmentData(assessmentId!),
  );

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const completion = data?.completions[0];
  const report = completion
    ? data?.reports.find((r) => r.completionId === completion.id)
    : undefined;

  async function regenerate(): Promise<void> {
    if (!completion) return;
    setIsRegenerating(true);
    setRegenerateError(null);
    try {
      const res = await patientAssessmentsAnalysisControllerAnalyze({
        path: { completionId: completion.id },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      await mutate();
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : "Regenerate failed");
      throw err;
    } finally {
      setIsRegenerating(false);
    }
  }

  return {
    completion,
    report,
    regenerate,
    isRegenerating,
    regenerateError,
    isLoading,
    error,
  };
}
