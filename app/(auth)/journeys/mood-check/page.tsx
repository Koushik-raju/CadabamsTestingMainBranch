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
 *   - Header uses the shared BackButton + flat title (no gradient banner).
 *   - On form submit, flips isSubmitting, routes back, then resets.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   isSubmitting     — local state toggled during submission
 *   handleSubmit     — async submit handler passed to MoodCheckForm
 *   MoodCheckPage    — default export, the page component
 *
 * DEPENDENCIES:
 *   next/navigation (useRouter), BackButton, MoodCheckForm, Skeleton
 *
 * LAST UPDATED: 2026-04-20 — align layout with DESIGN_GUIDELINES (flat header, pb-24, section spacing).
 */
'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/shared/navigation/back-button';
import { MoodCheckForm } from '@/components/journey/mood-check-form';
import { Skeleton } from '@/components/ui/skeleton';

function MoodCheckContent() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (_answers: Record<string, number>) => {
    setIsSubmitting(true);
    router.back();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/journeys" />
        <h1 className="flex-1 text-lg font-bold text-foreground">Mood Check-In</h1>
      </div>

      <div className="px-4">
        <MoodCheckForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          title="How are you feeling?"
          subtitle="Take a moment to reflect and log your current mood."
          submitLabel="Save Mood"
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
