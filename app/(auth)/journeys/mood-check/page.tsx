/**
 * FILE: app/(auth)/journeys/mood-check/page.tsx
 *
 * PURPOSE:
 *   Renders the standalone Mood Check-In page where a user can log their
 *   current mood via the shared MoodCheckForm. Follows the Compact Card UI
 *   design language defined in docs/DESIGN_GUIDELINES.md.
 *
 * LOGIC OVERVIEW:
 *   - Wraps content in a Suspense boundary with a shaped skeleton fallback.
 *   - Header uses the shared PageHeader component.
 *   - On form submit, flips isSubmitting, routes back, then resets.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   isSubmitting     — local state toggled during submission
 *   handleSubmit     — async submit handler passed to MoodCheckForm
 *   MoodCheckPage    — default export, the page component
 *
 * DEPENDENCIES:
 *   next/navigation (useRouter), PageHeader, MoodCheckForm, Skeleton
 *
 * LAST UPDATED: 2026-04-24 — no mood pre-selected unless ?mood= param is present in URL
 */
"use client";

import { MoodCheckForm } from "@/components/journey/mood-check-form";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useJourneyTaskContinuation } from "@/hooks/journeys/use-journey-task-continuation";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function MoodCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const continuation = useJourneyTaskContinuation("MOOD");

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Map home-header mood ID (1–5) → form value (2–10) via id × 2.
   * Falls back to 6 (neutral, middle step) when no param is present. */
  const moodParam = searchParams.get("mood");
  const defaultMoodValue = moodParam ? Math.min(10, Math.max(2, Number(moodParam) * 2)) : undefined;

  // Collapse the multi-question mood form down to the MOOD proof the
  // backend expects (moodBefore + moodAfter, 1..10). We take q_0 as
  // "before" and the last answered question as "after"; both fall back
  // to a neutral 5 when unavailable.
  function buildMoodProof(answers: Record<string, number>): {
    moodBefore: number;
    moodAfter: number;
  } {
    const keys = Object.keys(answers).sort();
    const first = keys[0] ? answers[keys[0]] : undefined;
    const last = keys.length > 1 ? answers[keys[keys.length - 1]] : first;
    const clamp = (n: number | undefined) => {
      const v = n ?? 5;
      return Math.min(10, Math.max(1, Math.round(v)));
    };
    return { moodBefore: clamp(first), moodAfter: clamp(last) };
  }

  const handleSubmit = async (answers: Record<string, number>) => {
    setIsSubmitting(true);
    try {
      if (continuation.active) {
        const { moodBefore, moodAfter } = buildMoodProof(answers);
        await continuation.markCompleted(
          { kind: "MOOD", moodBefore, moodAfter },
          { proofPreview: `Mood ${moodBefore} → ${moodAfter}` },
        );
      }
    } catch (e) {
      console.error("[MoodCheckPage] journey completion failed", e);
    } finally {
      setIsSubmitting(false);
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Mood Check-In" fallback="/journeys" />

      <div className="px-4">
        <MoodCheckForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          title="How are you feeling?"
          subtitle="Take a moment to reflect and log your current mood."
          submitLabel="Save Mood"
          defaultMoodValue={defaultMoodValue}
        />
      </div>
    </div>
  );
}

function MoodCheckFallback() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="px-4 flex flex-col gap-5">
        <Skeleton className="h-[140px] w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function MoodCheckPage() {
  return (
    <Suspense fallback={<MoodCheckFallback />}>
      <MoodCheckContent />
    </Suspense>
  );
}
