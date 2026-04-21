/**
 * FILE: app/(auth)/assessments/[id]/reports/page.tsx
 *
 * PURPOSE:
 *   Lists every stored LLM report (assessment analysis) the signed-in patient
 *   has generated for this assessment template. Each row can be expanded to
 *   view the full markdown analysis inline.
 *
 * LOGIC OVERVIEW:
 *   - Reads the assessmentId route param.
 *   - Fetches reports via useAssessmentReports(assessmentId).
 *   - Renders loading skeletons, error state with Retry, empty state with a CTA
 *     back to the assessment detail page, and a grouped list card of reports.
 *   - Each card row shows completedAt, optional score/severity (from completion),
 *     a short excerpt, and toggles a full markdown view when tapped.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   assessmentId — route param
 *   reports      — AssessmentReport[] from useAssessmentReports
 *   expandedId   — id of the currently expanded report row (or null)
 *
 * DEPENDENCIES:
 *   useAssessmentReports   — wraps patientAssessmentsAnalysisControllerList + list-mine
 *   BackButton             — standard navigation affordance
 *   react-markdown         — renders analysis.result markdown
 *
 * LAST UPDATED: 2026-04-21 — use scorePercentage from DTO; narrow severity to enum
 */
'use client';

import { use, useState } from 'react';
import Markdown from 'react-markdown';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/shared/navigation/back-button';
import { useAssessmentReports, type AssessmentReport } from '@/hooks/assessments/use-assessment-reports';
import { AlertCircle, ChevronDown, ChevronUp, FileText, Sparkles } from 'lucide-react';

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

function excerpt(md: string, max = 140): string {
  const stripped = md.replace(/[#>*_`\-]/g, '').replace(/\s+/g, ' ').trim();
  return stripped.length > max ? `${stripped.slice(0, max)}…` : stripped;
}

export default function AssessmentReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assessmentId } = use(params);
  const { reports, isLoading, error } = useAssessmentReports(assessmentId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback={`/assessments/${assessmentId}/details`} />
        <h1 className="flex-1 text-lg font-bold text-foreground">Previous Reports</h1>
      </div>

      <div className="px-4">
        {isLoading && <ReportsSkeleton />}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-sm text-destructive font-medium">Failed to load reports.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && !error && reports.length === 0 && <ReportsEmpty assessmentId={assessmentId} />}

        {!isLoading && !error && reports.length > 0 && (
          <Card>
            <CardContent className="py-0 px-3">
              {reports.map((report, i) => (
                <div key={report.id}>
                  <ReportRow
                    report={report}
                    expanded={expandedId === report.id}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === report.id ? null : report.id))
                    }
                  />
                  {i < reports.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ReportRow({
  report,
  expanded,
  onToggle,
}: {
  report: AssessmentReport;
  expanded: boolean;
  onToggle: () => void;
}) {
  const severity = report.completion?.severity;
  const pct = report.completion?.scorePercentage ?? null;

  return (
    <div className="py-3">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {formatDate(report.createdAt)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {excerpt(report.result) || 'View full report'}
          </p>
          {(severity || pct != null) && (
            <div className="flex items-center gap-2 mt-1.5">
              {severity && (
                <span className="text-[10px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                  {severity}
                </span>
              )}
              {pct != null && (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {pct}%
                </span>
              )}
            </div>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 rounded-xl border border-border bg-card p-4">
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
            {report.result}
          </Markdown>
          <p className="text-[10px] text-muted-foreground mt-3">Model: {report.model}</p>
        </div>
      )}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <Card>
      <CardContent className="py-0 px-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center gap-3 py-3">
              <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3 rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
              <Skeleton className="w-4 h-3 rounded" />
            </div>
            {i < 3 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReportsEmpty({ assessmentId }: { assessmentId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">No reports yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Complete this assessment to generate your first AI-powered report.
        </p>
      </div>
      <Button variant="outline" asChild>
        <a href={`/assessments/${assessmentId}/details`}>Take Assessment</a>
      </Button>
    </div>
  );
}
