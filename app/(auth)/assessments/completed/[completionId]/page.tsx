/**
 * FILE: app/(auth)/assessments/completed/[completionId]/page.tsx
 *
 * PURPOSE:
 *   Read-only view of a single assessment completion — shows a summary card
 *   then each question followed by the patient's answer(s), using CMS question
 *   data to show real question text instead of the stored assessment title.
 *
 * LOGIC OVERVIEW:
 *   1. Reads completionId from route params.
 *   2. Fetches CompletionResponseDto via useCompletionById(completionId).
 *   3. Once assessmentKey is known, also fetches the CMS assessment via
 *      useAssessmentById(assessmentKey) to get question titles and sub-questions.
 *   4. Builds a Map<questionId, AssessmentQuestion> from CMS data.
 *      questionId is parsed from questionKey ("q_{id}_step_{n}" → id).
 *   5. Filters out view_text rows (empty answerValue) and rows with no
 *      corresponding CMS question.
 *   6. For QA-type questions with JSON answerValues like {"qa_0":"Always",...},
 *      expands into sub-rows using question.questions[n].question as the label.
 *   7. For plain-string answers, shows answer directly below the question title.
 *   8. Renders summary card (severity/score/count) + grouped Q&A card + CTAs.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   completionId   — route param UUID
 *   completion     — CompletionResponseDto from useCompletionById
 *   assessment     — CMS AssessmentItem from useAssessmentById (for question text)
 *   questionMap    — Map<questionId, question> built from assessment.Questions
 *   displayRows    — processed rows ready to render (filtered, enriched)
 *
 * DEPENDENCIES:
 *   useCompletionById  — hooks/assessments/use-assessment-detail
 *   useAssessmentById  — hooks/assessments/use-assessment-detail
 *   BackButton         — shared navigation
 *
 * LAST UPDATED: 2026-04-21 — flatten Q&A into single divide-y list to remove double-padding gaps;
 *   group title shown only when it changes across groups; sub-answers sorted by qa_N index
 */
'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/shared/navigation/back-button';
import type { CompletionResponseDto } from '@/sdk/backend-v2';
import {
  useCompletionById,
  useAssessmentById,
} from '@/hooks/assessments/use-assessment-detail';
import { AlertCircle, ClipboardList, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type SeverityConfig = {
  gradient: string;
  badgeBg: string;
  badgeText: string;
  label: string;
};

type AnswerItem = {
  key: string;
  subLabel?: string;  // set for qa sub-questions
  answer: string;
};

type QuestionGroup = {
  questionKey: string;   // React key
  title: string;
  items: AnswerItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverityConfig(severity: CompletionResponseDto['severity']): SeverityConfig {
  if (severity === 'minimal')  return { gradient: 'from-emerald-500 to-teal-600',  badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', label: 'Minimal' };
  if (severity === 'mild')     return { gradient: 'from-sky-500 to-blue-600',       badgeBg: 'bg-sky-100',     badgeText: 'text-sky-700',     label: 'Mild' };
  if (severity === 'moderate') return { gradient: 'from-amber-400 to-orange-500',   badgeBg: 'bg-amber-100',   badgeText: 'text-amber-700',   label: 'Moderate' };
  if (severity === 'severe')   return { gradient: 'from-red-500 to-rose-600',       badgeBg: 'bg-red-100',     badgeText: 'text-red-700',     label: 'Severe' };
  return                        { gradient: 'from-violet-500 to-purple-600', badgeBg: 'bg-muted',       badgeText: 'text-muted-foreground', label: 'Completed' };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// "q_xxx_step_3" → "Question 4"  (1-based fallback when questionId has no CMS match)
function fallbackQuestionLabel(questionKey: string): string {
  const match = questionKey.match(/_step_(\d+)$/);
  return match ? `Question ${parseInt(match[1], 10) + 1}` : 'Question';
}

// "qa_2" → "Part 3"  (1-based);  anything else → as-is
function readableSubLabel(key: string): string {
  const match = key.match(/^qa_(\d+)$/);
  return match ? `Part ${parseInt(match[1], 10) + 1}` : key;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompletedAssessmentPage({
  params,
}: {
  params: Promise<{ completionId: string }>;
}) {
  const { completionId } = use(params);

  const { data: completion, isLoading: loadingCompletion, error: completionError } =
    useCompletionById(completionId);

  const { data: assessment, isLoading: loadingAssessment } =
    useAssessmentById(completion?.assessmentKey ?? null);

  const isLoading = loadingCompletion || (!!completion && loadingAssessment);

  // Map questionId → CMS question object for O(1) lookup
  const questionMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof assessment>['Questions'][number]>();
    for (const q of assessment?.Questions ?? []) {
      map.set(q.id, q);
    }
    return map;
  }, [assessment]);

  // Group answers by question — one QuestionGroup per answer row in the completion.
  // QA-type steps use answer.subAnswers (structured from backend); view_text/empty rows skipped.
  const questionGroups = useMemo((): QuestionGroup[] => {
    if (!completion) return [];
    const groups: QuestionGroup[] = [];

    for (const ans of completion.answers) {
      if (!ans.answerValue || ans.answerValue.trim() === '') continue;

      // Use answer.questionId (CMS CUID) if present, else fall back to questionKey-based lookup
      const cmsQ = ans.questionId ? questionMap.get(ans.questionId) : undefined;
      const title = cmsQ?.title || cmsQ?.label || fallbackQuestionLabel(ans.questionKey);

      const items: AnswerItem[] = [];
      if (ans.subAnswers && ans.subAnswers.length > 0) {
        const subQuestions = cmsQ?.questions ?? [];
        const sorted = [...ans.subAnswers].sort((a, b) => {
          const ai = parseInt((a.key ?? 'qa_0').replace('qa_', ''), 10);
          const bi = parseInt((b.key ?? 'qa_0').replace('qa_', ''), 10);
          return ai - bi;
        });
        sorted.forEach((sub, i) => {
          if (!sub.answer) return;
          const key = sub.key ?? `qa_${i}`;
          const idx = parseInt(key.replace('qa_', ''), 10);
          items.push({
            key: `${ans.questionKey}_${key}`,
            subLabel: subQuestions[idx]?.question || readableSubLabel(key),
            answer: sub.answer,
          });
        });
      } else {
        items.push({ key: ans.questionKey, answer: ans.answerValue });
      }

      if (items.length > 0) groups.push({ questionKey: ans.questionKey, title, items });
    }

    return groups;
  }, [completion, questionMap]);

  const config = getSeverityConfig(completion?.severity);
  const pct = completion?.scorePercentage ?? null;

  if (isLoading) return <LoadingSkeleton />;

  if (completionError || !completion) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="font-semibold text-foreground">Could not load responses</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">
          This completion may no longer be available.
        </p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const title = assessment?.title || completion.assessmentTitle || completion.assessmentKey;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/assessments" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight truncate">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(completion.completedAt)}</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Summary card */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              'relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0',
              'flex items-center justify-center overflow-hidden shadow-sm',
              config.gradient,
            )}>
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Assessment Summary</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', config.badgeBg, config.badgeText)}>
                  {config.label}
                </span>
                {pct !== null && (
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Score {pct}%
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {questionGroups.length} question{questionGroups.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Q&A list — flat item rows, group title shown only when it changes */}
        {questionGroups.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Your Responses</h2>
            <Card>
              <CardContent className="py-2 px-4 divide-y divide-border">
                {questionGroups.flatMap((group, gi) => {
                  const prevTitle = gi > 0 ? questionGroups[gi - 1].title : null;
                  const showTitle = group.title !== prevTitle;
                  return group.items.map((item, ii) => (
                    <div key={item.key} className="py-3">
                      {showTitle && ii === 0 && (
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {group.title}
                        </p>
                      )}
                      {item.subLabel && (
                        <p className="text-sm text-foreground leading-snug">
                          {item.subLabel}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-primary leading-snug mt-1">
                        {item.answer}
                      </p>
                    </div>
                  ));
                })}
              </CardContent>
            </Card>
          </section>
        )}

        {/* CTAs */}
        <Link
          href={`/assessments/${completion.assessmentKey}/result`}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-border bg-card hover:bg-muted/50 active:bg-muted transition-colors text-sm font-semibold text-foreground"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          View AI Report
        </Link>

        <Link
          href={`/assessments/${completion.assessmentKey}`}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all text-sm font-semibold text-primary-foreground"
        >
          Take Again
        </Link>

        <Link
          href={`/assessments/${completion.assessmentKey}/reports`}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-2xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          All Reports
        </Link>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/3 rounded" />
        </div>
      </div>
      <div className="px-4 space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/3 rounded" />
          <Card>
            <CardContent className="py-0 px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="py-3.5 space-y-1.5">
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                    <Skeleton className="h-4 w-1/3 rounded" />
                  </div>
                  {i < 5 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
