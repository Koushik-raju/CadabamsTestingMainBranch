/**
 * FILE: app/(auth)/assessments/[id]/generate/[completionId]/page.tsx
 *
 * PURPOSE:
 *   "Generating Report" page — auto-fires the LLM analyze call on mount,
 *   shows a loading state while it runs, then routes to /result on success.
 *   Visually continues from the "Assessment Complete" screen on the wizard.
 *
 * LOGIC OVERVIEW:
 *   - patientAssessmentsAnalysisControllerAnalyze({ path: { completionId } })
 *     auto-fires on mount (guarded against strict-mode double-invoke via a
 *     ref). On success it revalidates the reports cache and router.replaces
 *     to /assessments/[id]/result.
 *   - On failure, an inline error is shown and the CTA becomes a Try Again
 *     button that re-runs the analyze call.
 *   - Layout mirrors the Assessment Complete screen: X header + full progress
 *     bar, double-ring circle (spinner while loading, Sparkles on error),
 *     centered heading/subtext, sticky bottom button.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   assessmentId / completionId — route params
 *   isGenerating / error        — local UI state
 *
 * DEPENDENCIES:
 *   patientAssessmentsAnalysisControllerAnalyze — SDK analyze (upsert) endpoint
 *   assessmentReportsKey + useSWRConfig.mutate  — revalidate result cache
 *
 * LAST UPDATED: 2026-04-24 — redesigned to visually continue from Assessment Complete screen
 */
"use client";

import { Button } from "@/components/ui/button";
import { assessmentReportsKey } from "@/lib/swr-keys";
import { patientAssessmentsAnalysisControllerAnalyze } from "@/sdk/backend-v2";
import { ArrowRight, Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";

export default function AssessmentGeneratePage({
  params,
}: {
  params: Promise<{ id: string; completionId: string }>;
}) {
  const { id: assessmentId, completionId } = use(params);
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Guards against a second fire from React 18 strict-mode double-invoke.
  const hasStartedRef = useRef(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await patientAssessmentsAnalysisControllerAnalyze({
        path: { completionId },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      await mutate(assessmentReportsKey(assessmentId));
      router.replace(`/assessments/${assessmentId}/result`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header: X close + full progress bar — mirrors Assessment Complete screen */}
      <div className="flex items-center gap-3 px-3 py-3 bg-card">
        <button
          onClick={() => router.push(`/assessments/${assessmentId}/details`)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-full" />
        </div>
      </div>

      {/* Content — same vertical rhythm as Assessment Complete */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6">
        {/* Double-ring circle: spinner while generating, Sparkles icon on error */}
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            {isGenerating ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Sparkles className="w-8 h-8 text-primary" />
            )}
          </div>
        </div>

        {/* Heading + subtext */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            {isGenerating ? (
              <>
                Generating
                <br />
                Your Report
              </>
            ) : (
              <>
                Something
                <br />
                Went Wrong
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xs mx-auto">
            {isGenerating
              ? "We're analysing your responses and compiling your personalised AI insights."
              : "We couldn't generate your report. Please try again."}
          </p>
          {error && <p className="text-xs text-destructive max-w-xs mx-auto">{error}</p>}
        </div>

        {/* AI disclaimer card — same as Assessment Complete, shown while generating */}
        {isGenerating && (
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-4 flex gap-3 items-start">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">AI-Generated Report</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This report is generated using artificial intelligence based on your responses. It
                is for informational purposes only and does not replace professional medical advice.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button — hidden while generating, shown on error */}
      {!isGenerating && (
        <div className="sticky bottom-0 px-5 pt-3 pb-10 bg-card border-t border-border">
          <Button
            onClick={handleGenerate}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-2xl text-sm tracking-widest uppercase flex items-center justify-center gap-2"
          >
            Try Again
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
