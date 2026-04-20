/**
 * FILE: app/(auth)/assessments/[id]/result/page.tsx
 *
 * PURPOSE:
 *   Post-submit landing page for an assessment. If a stored AI report already
 *   exists for the patient's latest completion, it is rendered inline with a
 *   subtle "Regenerate" pill at the top. Otherwise a hero "Generate Report" CTA
 *   kicks off analysis for the latest completion.
 *
 * LOGIC OVERVIEW:
 *   - Reads assessmentId from route params.
 *   - useLatestAssessmentResult(assessmentId) returns the most recent completion,
 *     its matching stored analysis (if any), and a regenerate() action that
 *     re-runs the analyze endpoint (which upserts the row) and revalidates SWR.
 *   - Branches rendering on four states: loading → skeleton, error → retry,
 *     completion without report → redirect to the /generate/[completionId]
 *     route (which hosts the Generate CTA), completion with report → markdown
 *     body + small Regenerate pill + link to all reports.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   assessmentId     — route param
 *   completion       — latest CompletionResponseDto for this assessment
 *   report           — stored AssessmentAnalysisDto for that completion
 *   regenerate       — re-run analyze (upsert) then revalidate
 *   isRegenerating   — disables buttons and shows spinner while running
 *
 * DEPENDENCIES:
 *   useLatestAssessmentResult — hooks/assessments/use-assessment-reports
 *   BackButton                — shared navigation
 *   react-markdown            — renders report.result
 *
 * LAST UPDATED: 2026-04-20 — split Generate CTA into its own
 *   /assessments/[id]/generate/[completionId] route; this page now only
 *   renders an existing report (or redirects when none exists yet).
 */
'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import { useLatestAssessmentResult } from '@/hooks/assessments/use-assessment-reports';
import {
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AssessmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const {
    completion,
    report,
    regenerate,
    isRegenerating,
    regenerateError,
    isLoading,
    error,
  } = useLatestAssessmentResult(assessmentId);

  const onRegenerate = async () => {
    try {
      await regenerate();
    } catch {
      /* error surfaced via regenerateError */
    }
  };

  // Completion exists but no stored report yet → send user to the dedicated
  // Generate page so the CTA lives on its own route.
  useEffect(() => {
    if (!isLoading && !error && completion && !report) {
      router.replace(`/assessments/${assessmentId}/generate/${completion.id}`);
    }
  }, [isLoading, error, completion, report, assessmentId, router]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/assessments" />
        <h1 className="flex-1 text-lg font-bold text-foreground">Your Report</h1>
        {report && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground bg-muted hover:bg-muted/80 disabled:opacity-60 px-2.5 py-1.5 rounded-full transition-colors"
            aria-label="Regenerate report"
          >
            {isRegenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {isRegenerating ? 'Regenerating' : 'Regenerate'}
          </button>
        )}
      </div>

      <div className="px-4">
        {isLoading && <ResultSkeleton />}

        {!isLoading && error && (
          <ErrorState onRetry={() => window.location.reload()} />
        )}

        {!isLoading && !error && !completion && (
          <NoCompletionState
            onTake={() => router.push(`/assessments/${assessmentId}/details`)}
          />
        )}

        {!isLoading && !error && completion && !report && <ResultSkeleton />}

        {!isLoading && !error && completion && report && (
          <ReportView
            assessmentId={assessmentId}
            report={report.result}
            model={report.model}
            completedAt={completion.completedAt}
            severity={completion.severity ?? undefined}
            totalScore={completion.totalScore ?? undefined}
            maxScore={completion.maxScore ?? undefined}
            regenerateError={regenerateError}
          />
        )}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Couldn&apos;t load your report</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Something went wrong fetching the latest completion.
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

function NoCompletionState({ onTake }: { onTake: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">No completion yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Take the assessment first to generate your personalised report.
        </p>
      </div>
      <Button variant="outline" onClick={onTake}>
        Take Assessment
      </Button>
    </div>
  );
}

function ReportView({
  assessmentId,
  report,
  model,
  completedAt,
  severity,
  totalScore,
  maxScore,
  regenerateError,
}: {
  assessmentId: string;
  report: string;
  model: string;
  completedAt: string;
  severity?: string;
  totalScore?: number;
  maxScore?: number;
  regenerateError: string | null;
}) {
  const pct =
    typeof totalScore === 'number' && typeof maxScore === 'number' && maxScore > 0
      ? Math.round((totalScore / maxScore) * 100)
      : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">
              AI-Generated Insights
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted {formatDate(completedAt)}
            </p>
            {(severity || pct != null) && (
              <div className="flex items-center gap-2 mt-2">
                {severity && (
                  <span className="text-[10px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                    {severity}
                  </span>
                )}
                {pct != null && (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    Score: {pct}%
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {regenerateError && (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{regenerateError}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <Markdown
            components={{
              h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold text-foreground mt-4 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-bold text-foreground mt-3 mb-1.5">{children}</h3>,
              p: ({ children }) => <p className="text-sm text-foreground/80 leading-relaxed mb-3">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm text-foreground/80 leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            }}
          >
            {report}
          </Markdown>
          <p className="text-[10px] text-muted-foreground mt-3">Model: {model}</p>
        </CardContent>
      </Card>

      <Link
        href={`/assessments/${assessmentId}/reports`}
        className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-border bg-card hover:bg-muted/50 active:bg-muted transition-colors text-sm font-semibold text-foreground"
      >
        <FileText className="w-4 h-4" />
        View All Reports
      </Link>
    </div>
  );
}
