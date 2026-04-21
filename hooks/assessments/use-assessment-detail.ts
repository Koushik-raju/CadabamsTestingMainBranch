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
 *      for the current patient via patientAssessmentsControllerListMine, sorts
 *      them newest-first, and normalises each into AssessmentSubmission shape.
 *   3. useAssessmentScoreSummary(leadId, assessmentId) — composes
 *      useAssessmentSubmissions and runs deriveScoreSummary on the result to
 *      produce a human-readable label/value pair for the latest submission.
 *   4. submitAssessment(leadId, assessmentId, answers) — serialises question
 *      answers and POSTs a new completion via
 *      patientAssessmentsControllerCreateCompletion; returns the new completion id.
 *   5. analyzeAssessmentCompletion(completionId) — calls the backend LLM analysis
 *      endpoint via patientAssessmentsAnalysisControllerAnalyze and returns the
 *      result string.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AssessmentItem          — re-exported mapped type for a single assessment
 *   AssessmentSubmission    — normalised shape of a past completion record
 *   useAssessmentById       — SWR hook; returns { data: AssessmentItem | null, isLoading, error }
 *   useAssessmentSubmissions — SWR hook; returns { data: AssessmentSubmission[], isLoading, error }
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
 * LAST UPDATED: 2026-04-21 — add file header
 */

import useSWR, { useSWRConfig } from 'swr';
import {
  cmsAssessmentsControllerFindOne,
  patientAssessmentsControllerListMine,
  patientAssessmentsControllerCreateCompletion,
  patientAssessmentsControllerGetCompletion,
  patientAssessmentsAnalysisControllerAnalyze,
} from '@/sdk/backend-v2';
import type { CompletionResponseDto } from '@/sdk/backend-v2';
import { assessmentByIdKey, assessmentSubmissionsKey, completionByIdKey } from '@/lib/swr-keys';
import { mapAssessment } from './use-assessments-page';
import type { AssessmentItem } from './use-assessments-page';

export type { AssessmentItem };

export interface AssessmentSubmission {
  id: string;
  date: string;
  assessmentKey: string;
  totalScore?: number;
  maxScore?: number;
  severity?: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Score summary derivation (retained for analysis page)
// ---------------------------------------------------------------------------

function deriveScoreSummary(
  submissions: AssessmentSubmission[]
): { label: string; value: string } | null {
  if (submissions.length === 0) return null;
  const latest = submissions[0];
  const numericScores: number[] = [];
  Object.entries(latest.data).forEach(([key, value]) => {
    if (key === 'date' || key.startsWith('_')) return;
    const entryData = value as Record<string, unknown>;
    const selected = entryData?.selected;
    if (typeof selected === 'number') numericScores.push(selected);
  });

  // If backend provides totalScore/maxScore, prefer that
  if (typeof latest.totalScore === 'number' && typeof latest.maxScore === 'number' && latest.maxScore > 0) {
    const percentage = Math.round((latest.totalScore / latest.maxScore) * 100);
    const label = latest.severity
      ? latest.severity.charAt(0).toUpperCase() + latest.severity.slice(1)
      : percentage >= 80 ? 'High' : percentage >= 60 ? 'Moderate' : percentage >= 40 ? 'Low' : 'Very Low';
    return { label, value: `${label} (${percentage}%)` };
  }

  if (numericScores.length === 0) return null;
  const avg = numericScores.reduce((a, b) => a + b, 0) / numericScores.length;
  const percentage = Math.round((avg / 5) * 100);
  let label = 'Low';
  if (percentage >= 80) label = 'High';
  else if (percentage >= 60) label = 'Moderate';
  else if (percentage >= 40) label = 'Low';
  else label = 'Very Low';
  return { label, value: `${label} (${percentage}%)` };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAssessmentById(id: string | null) {
  const { data: raw, isLoading, error } = useSWR(
    id ? assessmentByIdKey(id) : null,
    async () => {
      const res = await cmsAssessmentsControllerFindOne({ path: { id: id! } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? null;
    }
  );

  const assessment: AssessmentItem | null = raw ? mapAssessment(raw) : null;

  return { data: assessment, isLoading, error };
}

export function useAssessmentSubmissions(
  leadId: string | null,
  assessmentId: string | null
) {
  const { data, isLoading, error } = useSWR(
    leadId && assessmentId
      ? assessmentSubmissionsKey(leadId, assessmentId)
      : null,
    async () => {
      const res = await patientAssessmentsControllerListMine({
        path: { campus: 'cadabams' },
        query: { assessmentKey: assessmentId! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const completions: CompletionResponseDto[] = res.data ?? [];
      return completions
        .sort(
          (a, b) =>
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        )
        .map(
          (c): AssessmentSubmission => ({
            id: c.id,
            date: c.completedAt,
            assessmentKey: c.assessmentKey,
            totalScore: c.totalScore,
            maxScore: c.maxScore,
            severity: c.severity,
            data: Object.fromEntries(
              (c.answers ?? []).map((a) => [
                a.questionKey,
                { selected: a.answerValue, questionText: a.questionText },
              ])
            ),
          })
        );
    }
  );

  return { data: data ?? [], isLoading, error };
}

export function useAssessmentScoreSummary(
  leadId: string | null,
  assessmentId: string | null
) {
  const { data: submissions, isLoading, error } = useAssessmentSubmissions(
    leadId,
    assessmentId
  );
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
  answers: Record<string, unknown>
): Promise<string> {
  const answerRows = Object.entries(answers).map(([questionKey, value]) => {
    const v = value as Record<string, unknown>;
    // Serialize answer value — arrays get JSON-stringified, scalars get String()
    let answerValue: string;
    const raw = v?.selected ?? v?.text ?? v?.value ?? v?.level ?? v?.subAnswers ?? '';
    if (Array.isArray(raw) || (typeof raw === 'object' && raw !== null)) {
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
    path: { campus: 'cadabams' },
    body: {
      assessmentKey: assessmentId,
      completedAt: new Date().toISOString(),
      answers: answerRows,
    },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (!res.data?.id) throw new Error('Completion response missing id');
  return res.data.id;
}

// ---------------------------------------------------------------------------
// Analyze a stored completion via backend LLM endpoint
// ---------------------------------------------------------------------------

export async function analyzeAssessmentCompletion(
  completionId: string
): Promise<string> {
  const res = await patientAssessmentsAnalysisControllerAnalyze({
    path: { completionId },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  return res.data?.result ?? '';
}

// ---------------------------------------------------------------------------
// Fetch a single completion with all answers
// ---------------------------------------------------------------------------

export function useCompletionById(completionId: string | null) {
  return useSWR(
    completionId ? completionByIdKey(completionId) : null,
    async (): Promise<CompletionResponseDto> => {
      const res = await patientAssessmentsControllerGetCompletion({
        path: { campus: 'cadabams', id: completionId! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      if (!res.data) throw new Error('Completion not found');
      return res.data;
    }
  );
}
