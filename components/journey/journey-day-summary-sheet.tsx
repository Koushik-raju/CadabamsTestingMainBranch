/**
 * FILE: components/journey/journey-day-summary-sheet.tsx
 *
 * PURPOSE:
 *   Bottom sheet shown when all tasks of the current day are completed.
 *   Fetches the server-generated day summary and shows completion stats.
 *
 * LOGIC OVERVIEW:
 *   On open, calls journeysControllerGetDaySummary with enrollmentId + dayNumber.
 *   Shows loading skeleton, then renders summary text, task count, and a
 *   "Next Day →" CTA. Falls back to a static message on API error.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyDaySummarySheetProps  — props
 *   JourneyDaySummarySheet       — exported component
 *
 * DEPENDENCIES:
 *   journeysControllerGetDaySummary, DaySummaryResponseDto — @/sdk/backend-v2
 *   Sheet, SheetContent, SheetTitle — @/components/ui/sheet
 *   Skeleton — @/components/ui/skeleton
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { CheckCircle2, Flame, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "react-toastify";
import remarkGfm from "remark-gfm";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { completeJourneyDay } from "@/hooks/journeys/use-journey-detail";
import { type DaySummaryResponseDto, journeysControllerGetDaySummary } from "@/sdk/backend-v2";

interface JourneyDaySummarySheetProps {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  journeyId: string;
  dayNumber: number;
  totalDays: number;
  onContinue: () => void;
}

export function JourneyDaySummarySheet({
  open,
  onClose,
  enrollmentId,
  journeyId,
  dayNumber,
  totalDays,
  onContinue,
}: JourneyDaySummarySheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<DaySummaryResponseDto | null>(null);
  const [hasError, setHasError] = useState(false);

  const isLastDay = dayNumber === totalDays;

  // Gate against double-firing in React 18 dev strict mode (useEffect
  // runs twice — both fetches hit the server before any cleanup cancels
  // the first one's promise handler). Skip the second invocation when
  // the sheet has already fired for this exact (enrollmentId, dayNumber)
  // combination. Resets when the sheet closes.
  const lastFetchedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      lastFetchedKey.current = null;
      return;
    }
    const key = `${enrollmentId}:${dayNumber}`;
    if (lastFetchedKey.current === key) return;
    lastFetchedKey.current = key;

    let cancelled = false;
    setIsLoading(true);
    setHasError(false);
    setSummary(null);

    journeysControllerGetDaySummary({
      path: { id: enrollmentId },
      query: { day: dayNumber },
    })
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setHasError(true);
        } else {
          setSummary(res.data ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, enrollmentId, dayNumber]);

  async function handleContinue() {
    // Persist day completion so the server sets JourneyDayProgress.completed
    // and (for non-terminal days) seeds nextDayUnlocksAt. The call is
    // idempotent server-side — safe to retry.
    //
    // Surface failures via a toast: previously the catch silently
    // swallowed everything, which left the user thinking the day was
    // marked complete when in fact /me/journeys/.../complete-day had
    // returned 409 (e.g. unfinished tasks) — Growth would then look
    // empty even though they "did everything".
    try {
      await completeJourneyDay(enrollmentId, journeyId, dayNumber);
    } catch (e) {
      console.error("[JourneyDaySummarySheet] completeDay failed", e);
      const msg = (e as Error).message || "Could not complete the day. Please try again.";
      // Try to pull a human-readable line out of the JSON-stringified
      // backend error envelope so the toast isn't the raw payload.
      let friendly = msg;
      try {
        const parsed = JSON.parse(msg) as { message?: string | string[] };
        if (parsed?.message) {
          friendly = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
        }
      } catch {
        // not JSON — keep msg as-is
      }
      toast.error(friendly);
      return; // do NOT advance the UI when the persist failed
    }
    onContinue();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-0 pb-10 pt-0 max-h-[85vh] overflow-y-auto"
      >
        {/* Green gradient header tile */}
        <div className="relative w-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-6">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/10" />

          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-[var(--sh-1)]">
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white/10" />
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <SheetTitle className="text-xl font-bold text-white">
              {isLastDay ? "Journey Complete! 🎉" : `Day ${dayNumber} Complete!`}
            </SheetTitle>
          </div>
        </div>

        <div className="px-5 pt-5 flex flex-col gap-4">
          {isLoading ? (
            /* Loading skeleton */
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          ) : hasError || !summary ? (
            /* Error fallback */
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Day {dayNumber} complete! Keep going.
              </p>
              <button
                onClick={handleContinue}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.97] transition-transform"
              >
                {isLastDay ? "View Summary →" : "Next Day →"}
              </button>
            </div>
          ) : (
            /* Success state */
            <>
              {/* Task completion count */}
              <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-muted">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  {summary.completedTaskCount}/{summary.totalTaskCount} tasks completed
                </p>
              </div>

              {/* Summary text */}
              <div className="px-4 py-3 rounded-xl border bg-card prose prose-sm max-w-none text-muted-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-foreground [&_strong]:font-semibold">
                {summary.summary ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary.summary}</ReactMarkdown>
                ) : (
                  <p>Great work — keep your streak going!</p>
                )}
              </div>

              {/* Progress line */}
              <div className="flex items-center gap-2 justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground">
                  Day {dayNumber} of {totalDays}
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleContinue}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.97] transition-transform mt-1"
              >
                {isLastDay ? "View Summary →" : "Next Day →"}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
