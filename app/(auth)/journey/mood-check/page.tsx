'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BackButton } from '@/components/common/back-button';
import { MoodCheckForm } from '@/components/journey/mood-check-form';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

function MoodCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const journeyId = searchParams.get('journeyId');
  const dayNumber = searchParams.get('day');
  const taskId = dayNumber
    ? `mood_check_in_day_${dayNumber}`
    : 'mood_check_in';

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (answers: Record<string, number>) => {
    setIsSubmitting(true);
    try {
      const mobile = (user as Record<string, unknown>)?.caller_mobile as string | undefined;
      if (!mobile) {
        router.back();
        return;
      }
      const cleanMobile = mobile.replace(/\D/g, '');
      const { database } = await import('@/lib/firebase');
      const { ref, set } = await import('firebase/database');

      const timestamp = new Date().toISOString();
      const taskRef = journeyId
        ? ref(
            database,
            `userJourneysMobile/${cleanMobile}/journeyData/${journeyId}/tasks/${taskId}`
          )
        : ref(database, `userJourneysMobile/${cleanMobile}/tasks/${taskId}`);

      await set(taskRef, {
        taskId,
        type: 'mood',
        title: 'Mood Check-In',
        completedAt: timestamp,
        journeyId: journeyId ?? null,
        dayNumber: dayNumber ? Number(dayNumber) : null,
        moodDetails: answers,
      });

      router.back();
    } catch (err) {
      console.error('Error saving mood check:', err);
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3 border-b border-border">
        <BackButton fallback="/journey" />
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
