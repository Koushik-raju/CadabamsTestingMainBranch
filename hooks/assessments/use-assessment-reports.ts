/**
 * FILE: hooks/assessments/use-assessment-reports.ts
 *
 * PURPOSE:
 *   SWR hook that returns the current patient's stored LLM analyses (reports)
 *   for a single assessment template, joined with their source completions for
 *   score/severity context.
 *
 * LOGIC OVERVIEW:
 *   - Fetches the patient's completions for the given assessmentKey via
 *     patientAssessmentsControllerListMine.
 *   - Fetches the patient's stored analyses via
 *     patientAssessmentsAnalysisControllerList (backend scopes to the caller).
 *   - Filters analyses whose completionId belongs to the completion set above,
 *     attaches the matching completion (score, severity, completedAt), and
 *     returns them sorted newest-first by the analysis createdAt.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   useAssessmentReports(assessmentId) — returns { reports, isLoading, error }.
 *   AssessmentReport                    — AssessmentAnalysisDto + optional completion metadata.
 *
 * DEPENDENCIES:
 *   patientAssessmentsAnalysisControllerList   — SDK: list stored analyses
 *   patientAssessmentsControllerListMine       — SDK: list patient's completions
 *   assessmentReportsKey                       — SWR cache key factory
 *
 * LAST UPDATED: 2026-04-20 — initial implementation.
 */
import useSWR from 'swr';
import {
  patientAssessmentsAnalysisControllerList,
  patientAssessmentsControllerListMine,
} from '@/sdk/backend-v2';
import type {
  AssessmentAnalysisDto,
  CompletionResponseDto,
} from '@/sdk/backend-v2';
import { assessmentReportsKey } from '@/lib/swr-keys';

export interface AssessmentReport extends AssessmentAnalysisDto {
  completion?: CompletionResponseDto;
}

export function useAssessmentReports(assessmentId: string | null) {
  const { data, isLoading, error } = useSWR(
    assessmentId ? assessmentReportsKey(assessmentId) : null,
    async (): Promise<AssessmentReport[]> => {
      const [completionsRes, analysesRes] = await Promise.all([
        patientAssessmentsControllerListMine({
          path: { campus: 'cadabams' },
          query: { assessmentKey: assessmentId! },
        }),
        patientAssessmentsAnalysisControllerList(),
      ]);
      if (completionsRes.error) throw new Error(JSON.stringify(completionsRes.error));
      if (analysesRes.error) throw new Error(JSON.stringify(analysesRes.error));

      const completions = completionsRes.data ?? [];
      const byId = new Map<string, CompletionResponseDto>(
        completions.map((c) => [c.id, c])
      );

      const analyses = analysesRes.data?.items ?? [];
      return analyses
        .filter((a) => byId.has(a.completionId))
        .map((a) => ({ ...a, completion: byId.get(a.completionId) }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  );

  return { reports: data ?? [], isLoading, error };
}
