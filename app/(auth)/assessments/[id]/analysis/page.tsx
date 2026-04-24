/**
 * FILE: app/(auth)/assessments/[id]/analysis/page.tsx
 *
 * PURPOSE:
 *   Legacy assessment analysis page that displays a static AI-generated narrative
 *   summary and overall score for a completed assessment, with a CTA to book an
 *   appointment.
 *
 * LOGIC OVERVIEW:
 *   1. Unwraps the dynamic `[id]` route param via React `use(params)`.
 *   2. Derives `leadId` from the authenticated user via `useAuth`.
 *   3. Calls `useAssessmentScoreSummary(leadId, assessmentId)` to fetch the score
 *      summary and submission list for this assessment.
 *   4. Shows a skeleton loading state while data is in flight.
 *   5. Shows an error/unauthenticated state if the fetch fails or `leadId` is absent.
 *   6. If no submissions exist, renders an empty state with a "Take Assessment" CTA.
 *   7. If submissions exist, renders an AI badge, overall score heading (from
 *      `scoreSummary.value`), a static narrative paragraph block, an AI disclaimer,
 *      and a fixed-bottom "Book appointment" CTA button.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   assessmentId     — assessment ID extracted from the URL params
 *   leadId           — string lead ID derived from the authenticated user's `lead_id`
 *   scoreSummary     — object returned by the hook containing the overall score `value`
 *   submissions      — array of submission records; used to determine empty vs filled state
 *   hasSubmissions   — boolean derived from `submissions`; gates the narrative vs empty-state render
 *
 * DEPENDENCIES:
 *   useAssessmentScoreSummary  — SWR hook in hooks/assessments/use-assessment-detail
 *   useAuth                    — authentication hook providing the current user
 *   next/navigation useRouter  — for programmatic navigation (back, assessments list, booking)
 *   lucide-react               — Sparkles, AlertCircle, ChevronRight, X icons
 *
 * LAST UPDATED: 2026-04-21 — add file header
 */
"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssessmentScoreSummary } from "@/hooks/assessments/use-assessment-detail";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { AlertCircle, ChevronRight, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useMemo } from "react";

export default function AssessmentAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const leadId = useMemo(() => {
    return user?.lead_id ? String(user.lead_id) : null;
  }, [user]);

  const { scoreSummary, submissions, isLoading, error } = useAssessmentScoreSummary(
    leadId,
    assessmentId,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-5 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !leadId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center">
          {error ? String(error) : "Please log in to view your assessment report."}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const hasSubmissions = submissions && submissions.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-border bg-background">
        <button
          onClick={() => router.push("/assessments")}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Assessment Report</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {!hasSubmissions ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No report yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Complete the assessment to generate your personalized report.
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => router.push(`/assessments/${assessmentId}`)}
            >
              Take Assessment
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="pt-5 space-y-5">
            {/* AI badge */}
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI-generated summary</span>
            </div>

            {/* Score heading */}
            {scoreSummary && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Your activity assessment results
                </h2>
                <p className="text-sm text-muted-foreground">
                  Overall balance:{" "}
                  <span className="font-semibold text-foreground">{scoreSummary.value}</span>
                </p>
              </div>
            )}

            {/* Narrative */}
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>
                Based on your responses, your recent stress and activity levels suggest that you are
                managing most days reasonably well, but there are clear signs of mental fatigue and
                emotional overload on busier days.
              </p>
              <p>
                You reported <strong>frequent worry and restlessness</strong>, particularly in the
                evenings, along with occasional difficulty relaxing. At the same time, you also
                identified small, consistent sources of support — like routines, relationships, or
                hobbies — that are helping you stay grounded.
              </p>
              <p>
                Overall, your pattern points to a{" "}
                <strong>
                  mild to moderate level of stress (around {scoreSummary?.value || "60–75%"})
                </strong>
                . With some structured support, there is strong potential to bring this down and
                improve your sense of ease and control in daily life.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground leading-relaxed pt-2">
              This summary is generated by AI based on your answers. It is{" "}
              <strong>not a diagnosis</strong> and should be used as a reflection aid, not as
              medical advice.
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      {hasSubmissions && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-background border-t border-border space-y-2">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base"
            onClick={() => router.push("/consult/appointments")}
          >
            Book appointment with a specialist
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            You can share this report with a mental health professional to explore next steps
            together.
          </p>
        </div>
      )}
    </div>
  );
}
