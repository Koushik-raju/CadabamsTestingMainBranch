/**
 * FILE: app/(auth)/assessments/[id]/generate/[completionId]/page.tsx
 *
 * PURPOSE:
 *   Minimal "Generate Report" landing page. Reads completionId from the path,
 *   runs the LLM analyze call on tap, then routes to /result.
 *
 * LOGIC OVERVIEW:
 *   - patientAssessmentsAnalysisControllerAnalyze({ path: { completionId } })
 *     auto-fires on mount (guarded against strict-mode double-invoke via a
 *     ref). On success it revalidates the reports cache and router.replaces
 *     to /assessments/[id]/result.
 *   - On failure, an inline error is shown and the CTA becomes a Try Again
 *     button that re-runs the analyze call.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   assessmentId / completionId — route params
 *   isGenerating / error        — local UI state
 *
 * DEPENDENCIES:
 *   patientAssessmentsAnalysisControllerAnalyze — SDK analyze (upsert) endpoint
 *   assessmentReportsKey + useSWRConfig.mutate  — revalidate result cache
 *   PageHeader — shared navigation header
 *
 * LAST UPDATED: 2026-04-23 — migrated custom header div to PageHeader
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { assessmentReportsKey } from "@/lib/swr-keys";
import { patientAssessmentsAnalysisControllerAnalyze } from "@/sdk/backend-v2";
import { Loader2, Sparkles } from "lucide-react";
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
      <PageHeader title="" fallback="/assessments" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Generate Your Report</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          We&apos;ll analyse your responses and create a personalised AI summary.
        </p>

        {error && <p className="text-xs text-destructive mt-4 max-w-xs">{error}</p>}
      </div>

      <div className="px-5 pb-8">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating…
            </>
          ) : error ? (
            "Try Again"
          ) : (
            "Generate Report"
          )}
        </Button>
      </div>
    </div>
  );
}
