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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3 border-b border-border">
        <BackButton fallback="/journeys" />
        <h1 className="text-lg font-bold text-foreground">Mood Check-In</h1>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-6">
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
    <div className="min-h-screen bg-background px-4 pt-5">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
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
