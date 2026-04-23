/**
 * FILE: hooks/assessments/use-assessment-detail.ts
 *
 * PURPOSE:
 *   Provides SWR hooks and async action helpers for fetching and submitting
 *   assessment detail data, including individual assessment metadata,
 *   past submissions, and score summaries.
 *
 * LOGIC OVERVIEW:
 *   1. useAssessmentById(id) — fetches a single CMS assessment by ID via
 *      cmsAssessmentsControllerFindOne and maps the raw response to AssessmentItem.
 *   2. useAssessmentSubmissions(leadId, assessmentId) — fetches past completions
 *      for the current patient via patientAssessmentsControllerListMine (returned
 *      completedAt DESC by backend). Returns CompletionResponseDto[] directly.
 *   3. useAssessmentScoreSummary(leadId, assessmentId) — composes
 *      useAssessmentSubmissions and derives a human-readable label/value pair for
 *      the latest submission using scorePercentage and severity from the DTO.
 *   4. submitAssessment(leadId, assessmentId, answers) — serialises question
 *      answers and POSTs a new completion via
 *      patientAssessmentsControllerCreateCompletion; returns the new completion id.
 *   5. analyzeAssessmentCompletion(completionId) — calls the backend LLM analysis
 *      endpoint via patientAssessmentsAnalysisControllerAnalyze and returns the
 *      result string.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AssessmentItem          — re-exported mapped type for a single assessment
 *   useAssessmentById       — SWR hook; returns { data: AssessmentItem | null, isLoading, error }
 *   useAssessmentSubmissions — SWR hook; returns { data: CompletionResponseDto[], isLoading, error }
 *   useAssessmentScoreSummary — SWR hook; returns { scoreSummary, submissions, isLoading, error }
 *   submitAssessment        — async action; returns new completion id string
 *   analyzeAssessmentCompletion — async action; returns LLM analysis result string
 *
 * DEPENDENCIES:
 *   swr                                          — data fetching and caching
 *   cmsAssessmentsControllerFindOne              — SDK: fetch single CMS assessment
 *   patientAssessmentsControllerListMine         — SDK: list patient completions
 *   patientAssessmentsControllerCreateCompletion — SDK: create new completion
 *   patientAssessmentsAnalysisControllerAnalyze  — SDK: trigger LLM analysis
 *   assessmentByIdKey, assessmentSubmissionsKey  — SWR cache key factories
 *   mapAssessment                                — mapper from use-assessments-page
 *
 * LAST UPDATED: 2026-04-21 — reverted useCompletionById to CompletionResponseDto;
 *   CompletionDetailResponseDto removed from SDK, pending spec update for userResponse
 */

import { assessmentByIdKey, assessmentSubmissionsKey, completionByIdKey } from "@/lib/swr-keys";
import {
  cmsAssessmentsControllerFindOne,
  patientAssessmentsAnalysisControllerAnalyze,
  patientAssessmentsControllerCreateCompletion,
  patientAssessmentsControllerGetCompletion,
  patientAssessmentsControllerListMine,
} from "@/sdk/backend-v2";
import type { CompletionResponseDto } from "@/sdk/backend-v2";
import useSWR from "swr";
import { mapAssessment } from "./use-assessments-page";
import type { AssessmentItem } from "./use-assessments-page";

export type { AssessmentItem };

// ---------------------------------------------------------------------------
// Score summary derivation
// ---------------------------------------------------------------------------

function deriveScoreSummary(
  completions: CompletionResponseDto[],
): { label: string; value: string } | null {
  if (completions.length === 0) return null;
  const latest = completions[0];
  if (latest.severity == null && latest.scorePercentage == null) return null;
  const label = latest.severity
    ? latest.severity.charAt(0).toUpperCase() + latest.severity.slice(1)
    : "Completed";
  const value = latest.scorePercentage != null ? `${label} (${latest.scorePercentage}%)` : label;
  return { label, value };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAssessmentById(id: string | null) {
  const {
    data: raw,
    isLoading,
    error,
  } = useSWR(id ? assessmentByIdKey(id) : null, async () => {
    const res = await cmsAssessmentsControllerFindOne({ path: { id: id! } });
    if (res.error) throw new Error(JSON.stringify(res.error));
    return res.data ?? null;
  });

  const assessment: AssessmentItem | null = raw ? mapAssessment(raw) : null;

  return { data: assessment, isLoading, error };
}

export function useAssessmentSubmissions(leadId: string | null, assessmentId: string | null) {
  const { data, isLoading, error } = useSWR(
    leadId && assessmentId ? assessmentSubmissionsKey(leadId, assessmentId) : null,
    async (): Promise<CompletionResponseDto[]> => {
      const res = await patientAssessmentsControllerListMine({
        path: { campus: "cadabams" },
        query: { assessmentKey: assessmentId! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? [];
    },
  );

  return { data: data ?? [], isLoading, error };
}

export function useAssessmentScoreSummary(leadId: string | null, assessmentId: string | null) {
  const { data: submissions, isLoading, error } = useAssessmentSubmissions(leadId, assessmentId);
  return {
    scoreSummary: deriveScoreSummary(submissions),
    submissions,
    isLoading,
    error,
  };
}

// ---------------------------------------------------------------------------
// Submit assessment (backend-v2 only — no Firebase)
// ---------------------------------------------------------------------------

export async function submitAssessment(
  leadId: string,
  assessmentId: string,
  answers: Record<string, unknown>,
): Promise<string> {
  const answerRows = Object.entries(answers).map(([questionKey, value]) => {
    const v = value as Record<string, unknown>;
    let answerValue: string;
    const raw = v?.selected ?? v?.text ?? v?.value ?? v?.level ?? v?.subAnswers ?? "";
    if (Array.isArray(raw) || (typeof raw === "object" && raw !== null)) {
      answerValue = JSON.stringify(raw);
    } else {
      answerValue = String(raw);
    }
    return {
      questionKey,
      questionText: (v?.questionText as string) ?? undefined,
      answerValue,
    };
  });

  const res = await patientAssessmentsControllerCreateCompletion({
    path: { campus: "cadabams" },
    body: {
      assessmentKey: assessmentId,
      completedAt: new Date().toISOString(),
      answers: answerRows,
    },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (!res.data?.id) throw new Error("Completion response missing id");
  return res.data.id;
}

// ---------------------------------------------------------------------------
// Analyze a stored completion via backend LLM endpoint
// ---------------------------------------------------------------------------

export async function analyzeAssessmentCompletion(completionId: string): Promise<string> {
  const res = await patientAssessmentsAnalysisControllerAnalyze({
    path: { completionId },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  return res.data?.result ?? "";
}

// ---------------------------------------------------------------------------
// Fetch a single completion with all answers
// ---------------------------------------------------------------------------

export function useCompletionById(completionId: string | null) {
  return useSWR(
    completionId ? completionByIdKey(completionId) : null,
    async (): Promise<CompletionResponseDto> => {
      const res = await patientAssessmentsControllerGetCompletion({
        path: { campus: "cadabams", id: completionId! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      if (!res.data) throw new Error("Completion not found");
      return res.data;
    },
  );
}
