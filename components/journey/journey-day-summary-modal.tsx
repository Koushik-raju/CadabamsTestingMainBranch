/**
 * FILE: components/journey/journey-day-summary-modal.tsx
 *
 * PURPOSE:
 *   Modal opened when the user taps the "Summary" node at the end of a day on
 *   the journey path. Fetches the AI-generated summary via getDaySummary and
 *   renders it with react-markdown so headings, lists, and bold formatting
 *   produced by the model render correctly.
 *
 * LOGIC OVERVIEW:
 *   On open, calls journeysControllerGetDaySummary. While loading, shows a
 *   skeleton. On success, renders summary.summary through ReactMarkdown with
 *   remark-gfm (dynamically imported). If no summary is present (e.g. all tasks
 *   not yet complete), renders a neutral fallback. Errors fall back to the same
 *   neutral copy.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyDaySummaryModalProps — props shape
 *   JourneyDaySummaryModal      — default export component
 *   ReactMarkdown — dynamically imported react-markdown component
 *
 * DEPENDENCIES:
 *   journeysControllerGetDaySummary, DaySummaryResponseDto — @/sdk/backend-v2
 *   Dialog, DialogContent, DialogTitle — @/components/ui/dialog
 *   react-markdown (dynamic), remark-gfm
 *
 * LAST UPDATED: 2026-05-05 — Phase 2: dynamically imported react-markdown for on-demand modal rendering
 */
"use client";

import { Loader2, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { type DaySummaryResponseDto, journeysControllerGetDaySummary } from "@/sdk/backend-v2";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

interface JourneyDaySummaryModalProps {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  dayNumber: number;
  totalDays: number;
  onSummaryGenerated?: () => void;
}

export function JourneyDaySummaryModal({
  open,
  onClose,
  enrollmentId,
  dayNumber,
  totalDays,
  onSummaryGenerated,
}: JourneyDaySummaryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<DaySummaryResponseDto | null>(null);
  const [hasError, setHasError] = useState(false);

  // Keep a stable ref so fetchSummary's useCallback doesn't need to list
  // onSummaryGenerated as a dependency. Without this, any parent re-render
  // that passes a new inline function would recreate fetchSummary, causing
  // the useEffect to re-fire and spam the API.
  const onSummaryGeneratedRef = useRef(onSummaryGenerated);
  useEffect(() => {
    onSummaryGeneratedRef.current = onSummaryGenerated;
  });

  const fetchSummary = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setIsLoading(true);
      setHasError(false);
      try {
        const res = await journeysControllerGetDaySummary({
          path: { id: enrollmentId },
          query: { day: dayNumber },
        });
        if (signal?.cancelled) return;
        if (res.error) setHasError(true);
        else {
          setData(res.data ?? null);
          if (res.data?.summary) onSummaryGeneratedRef.current?.();
        }
      } catch {
        if (!signal?.cancelled) setHasError(true);
      } finally {
        if (!signal?.cancelled) setIsLoading(false);
      }
    },
    [enrollmentId, dayNumber],
  );

  useEffect(() => {
    if (!open) return;
    const signal = { cancelled: false };
    setData(null);
    void fetchSummary(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [open, fetchSummary]);

  const summaryText = data?.summary ?? null;
  const allTasksDone =
    !!data && data.totalTaskCount > 0 && data.completedTaskCount >= data.totalTaskCount;
  const canForceGenerate = allTasksDone && !summaryText && !isLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 px-5 pt-6 pb-5">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex items-center gap-3 relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles size={20} strokeWidth={2} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-white text-base font-bold">
                Day {dayNumber} Summary
              </DialogTitle>
              <p className="text-white/80 text-xs mt-0.5">
                Day {dayNumber} of {totalDays}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-0 pb-5 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
          ) : hasError || !summaryText ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-muted-foreground text-center">
                {canForceGenerate
                  ? `Your Day ${dayNumber} summary hasn't been generated yet.`
                  : `Summary will be available once you finish all tasks for Day ${dayNumber}.`}
              </p>
              {canForceGenerate && (
                <button
                  onClick={() => void fetchSummary()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold active:scale-[0.97] transition-transform"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate summary
                </button>
              )}
              {hasError && (
                <button
                  onClick={() => void fetchSummary()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-xs font-medium"
                >
                  <Loader2 className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
