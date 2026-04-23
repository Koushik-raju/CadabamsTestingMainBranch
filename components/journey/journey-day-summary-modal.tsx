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
 *   remark-gfm. If no summary is present (e.g. all tasks not yet complete),
 *   renders a neutral fallback. Errors fall back to the same neutral copy.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyDaySummaryModalProps — props shape
 *   JourneyDaySummaryModal      — default export component
 *
 * DEPENDENCIES:
 *   journeysControllerGetDaySummary, DaySummaryResponseDto — @/sdk/backend-v2
 *   Dialog, DialogContent, DialogTitle — @/components/ui/dialog
 *   ReactMarkdown, remarkGfm
 *
 * LAST UPDATED: 2026-04-22 — initial implementation.
 */
'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  journeysControllerGetDaySummary,
  type DaySummaryResponseDto,
} from '@/sdk/backend-v2';

interface JourneyDaySummaryModalProps {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  dayNumber: number;
  totalDays: number;
}

export function JourneyDaySummaryModal({
  open,
  onClose,
  enrollmentId,
  dayNumber,
  totalDays,
}: JourneyDaySummaryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<DaySummaryResponseDto | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);
    setHasError(false);
    setData(null);

    journeysControllerGetDaySummary({
      path: { id: enrollmentId },
      query: { day: dayNumber },
    })
      .then((res) => {
        if (cancelled) return;
        if (res.error) setHasError(true);
        else setData(res.data ?? null);
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

  const summaryText = data?.summary ?? null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 px-5 pt-6 pb-5">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex items-center gap-3 relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
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
        <div className="px-5 py-5 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
          ) : hasError || !summaryText ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Summary will be available once you finish all tasks for Day {dayNumber}.
            </p>
          ) : (
            <div className="prose prose-sm max-w-none text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {summaryText}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
