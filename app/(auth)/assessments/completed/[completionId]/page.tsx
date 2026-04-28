/**
 * FILE: app/(auth)/assessments/completed/[completionId]/page.tsx
 *
 * PURPOSE:
 *   Read-only view of a single assessment completion — shows a summary card
 *   then each question followed by the patient's answer, using the flat
 *   userResponse array returned by the completion endpoint.
 *
 * LOGIC OVERVIEW:
 *   1. Reads completionId from route params.
 *   2. Fetches CompletionResponseDto via useCompletionById(completionId).
 *   3. Renders completion.userResponse[] directly — each item has
 *      question.questionText and answer.answerText, already populated by
 *      the backend. No CMS fetch needed.
 *   4. Renders summary card (severity/score/count) + flat Q&A list + CTAs.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   completionId  — route param UUID
 *   completion    — CompletionResponseDto from useCompletionById
 *
 * DEPENDENCIES:
 *   useCompletionById — hooks/assessments/use-assessment-detail
 *   PageHeader        — shared navigation header
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompletionById } from "@/hooks/assessments/use-assessment-detail";
import { useJourneyTaskContinuation } from "@/hooks/journeys/use-journey-task-continuation";
import { cn } from "@/lib/utils";
import type { CompletionResponseDto } from "@/sdk/backend-v2";
import { AlertCircle, ClipboardList, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SeverityConfig = {
  gradient: string;
  badgeBg: string;
  badgeText: string;
  label: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverityConfig(severity: CompletionResponseDto["severity"]): SeverityConfig {
  if (severity === "minimal")
    return {
      gradient: "from-emerald-500 to-teal-600",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-700",
      label: "Minimal",
    };
  if (severity === "mild")
    return {
      gradient: "from-sky-500 to-blue-600",
      badgeBg: "bg-sky-100",
      badgeText: "text-sky-700",
      label: "Mild",
    };
  if (severity === "moderate")
    return {
      gradient: "from-amber-400 to-orange-500",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-700",
      label: "Moderate",
    };
  if (severity === "severe")
    return {
      gradient: "from-red-500 to-rose-600",
      badgeBg: "bg-red-100",
      badgeText: "text-red-700",
      label: "Severe",
    };
  return {
    gradient: "from-violet-500 to-purple-600",
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
    label: "Completed",
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompletedAssessmentPage({
  params,
}: {
  params: Promise<{ completionId: string }>;
}) {
  const { completionId } = use(params);

  const { data: completion, isLoading, error } = useCompletionById(completionId);

  const rows = completion?.userResponse ?? [];
  const config = getSeverityConfig(completion?.severity);
  const pct = completion?.scorePercentage ?? null;

  // When this report was reached via a journey task, mark the task
  // completed on the backend using this completion as proof, then let
  // the global FAB surface the "Return to journey" CTA.
  const continuation = useJourneyTaskContinuation("ASSESSMENT");
  const reportedRef = useRef(false);
  useEffect(() => {
    if (reportedRef.current) return;
    if (!continuation.active || !completion) return;
    reportedRef.current = true;
    const severityLabel = config.label;
    const pieces = [severityLabel, pct != null ? `${pct}%` : null].filter(Boolean) as string[];
    continuation
      .markCompleted(
        { kind: "ASSESSMENT", assessmentCompletionId: completion.id },
        { proofPreview: pieces.join(" · ") || undefined },
      )
      .catch((err) => {
        reportedRef.current = false;
        console.error("[CompletedAssessmentPage] journey completion failed", err);
      });
  }, [continuation, completion, config.label, pct]);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !completion) {
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

  const title = completion.assessmentTitle || completion.assessmentKey;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={title}
        subtitle={formatDate(completion.completedAt)}
        fallback="/assessments"
      />

      <div className="px-4 space-y-4">
        {/* Summary card */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={cn(
                "relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0",
                "flex items-center justify-center overflow-hidden shadow-[var(--sh-1)]",
                config.gradient,
              )}
            >
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Assessment Summary</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                    config.badgeBg,
                    config.badgeText,
                  )}
                >
                  {config.label}
                </span>
                {pct !== null && (
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Score {pct}%
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {rows.length} question{rows.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Q&A list */}
        {rows.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Your Responses</h2>
            <Card>
              <CardContent className="py-0 px-4">
                {rows.map((item, i) => (
                  <div key={`${item.question.questionKey}_${item.question.subQuestionKey ?? i}`}>
                    <div className="py-3">
                      <p className="text-sm text-foreground leading-snug">
                        {item.question.questionText}
                      </p>
                      <p className="text-sm font-semibold text-primary leading-snug mt-1">
                        {item.answer.answerText}
                      </p>
                    </div>
                    {i < rows.length - 1 && <Separator />}
                  </div>
                ))}
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
