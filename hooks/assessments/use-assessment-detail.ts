import useSWR, { useSWRConfig } from 'swr';
import {
  cmsAssessmentsControllerFindOne,
  patientAssessmentsControllerListMine,
  patientAssessmentsControllerCreateCompletion,
} from '@/sdk/backend-v2';
import type { CompletionResponseDto } from '@/sdk/backend-v2';
import { assessmentByIdKey, assessmentSubmissionsKey } from '@/lib/swr-keys';
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
): Promise<void> {
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

  await patientAssessmentsControllerCreateCompletion({
    path: { campus: 'cadabams' },
    body: {
      assessmentKey: assessmentId,
      completedAt: new Date().toISOString(),
      answers: answerRows,
    },
  });
}
