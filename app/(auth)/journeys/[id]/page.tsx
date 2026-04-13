'use client';

import { use, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import { CheckCircle2, Clock, Layers, Timer, ChevronRight, AlertCircle, Zap } from 'lucide-react';
import {
  useJourneyDetail,
  useJourneyProgress,
  subscribeToJourney,
} from '@/hooks/use-journey';
import { useAuth } from '@/hooks/use-auth';
import { extractJourneyName, extractJourneyDescription } from '@/types/journey';
import { fixImageUrl } from '@/lib/utils';
import { hapticMedium } from '@/lib/haptics';

interface PageProps {
  params: Promise<{ id: string }>;
}

function JourneyLandingContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const mobile = (
    ((user as Record<string, unknown>)?.caller_mobile as string | undefined) ??
    ((user as Record<string, unknown>)?.phone_number as string | undefined)
  )?.replace(/\D/g, '') ?? null;

  const { journey, isLoading } = useJourneyDetail(id);
  const { progress, isLoading: progLoad } = useJourneyProgress(id);
  const [subscribing, setSubscribing] = useState(false);

  if (isLoading || progLoad) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Skeleton className="h-56 w-full" />
          <div className="p-5 space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center">Journey not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const name = extractJourneyName(journey.name);
  const description = extractJourneyDescription(journey.description);
  const imageUrl = fixImageUrl(journey.icon);
  const isSubscribed = !!progress;
  const stepCount = journey.steps?.length ?? 0;
  const taskCount = (journey.steps ?? []).reduce((a, s) => a + (s.tasks?.length ?? 0), 0);
  const months = Math.max(1, Math.round(stepCount / 30));

  // Derive highlights from step titles (first 3)
  const highlights = (journey.steps ?? []).slice(0, 3).map((s) =>
    (typeof s.title === 'string' ? s.title : extractJourneyName(s.title as never))
      .replace(/^Day\s*\d+\s*[:\-·]?\s*/i, '')
      .trim()
  ).filter(Boolean);

  async function handleCTA() {
    if (isSubscribed) {
      router.push(`/journeys/${id}/details`);
      return;
    }
    if (!mobile) {
      router.push('/login');
      return;
    }
    setSubscribing(true);
    try {
      await subscribeToJourney(mobile, journey!);
      hapticMedium();
      router.push(`/journeys/${id}/details`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubscribing(false);
    }
  }

  const ctaLabel = isSubscribed
    ? 'Continue Journey'
    : journey.isPremium
    ? 'Try Day 1 Free'
    : 'Start Journey';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center px-2 py-2 border-b border-border bg-background">
        <BackButton fallback="/journeys" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Hero image */}
        <div className="w-full aspect-[4/3] bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>

        <div className="px-5 pt-5 space-y-5">
          {/* Badge */}
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-semibold text-primary tracking-wide">
              {journey.isPremium ? 'Premium Journey' : 'Free Journey'}
            </p>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground leading-tight">{name}</h1>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 py-3 border-y border-border">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{stepCount} Days</p>
                <p className="text-[11px] text-muted-foreground">Units</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{taskCount} Tasks</p>
                <p className="text-[11px] text-muted-foreground">Activities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {months} {months === 1 ? 'Month' : 'Months'}
                </p>
                <p className="text-[11px] text-muted-foreground">Duration</p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <ul className="space-y-4">
              {highlights.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-foreground">{point}</p>
                </li>
              ))}
            </ul>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center pb-2">
            This journey is for personal growth and wellness purposes and does not replace
            professional medical or psychological advice.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-background border-t border-border">
        {journey.isPremium && !isSubscribed && (
          <p className="text-[11px] text-muted-foreground text-center mb-2">
            Day 1 is free · Does not include appointments
          </p>
        )}
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base h-14 rounded-2xl"
          disabled={subscribing}
          onClick={handleCTA}
        >
          {subscribing ? 'Please wait...' : ctaLabel}
          {!subscribing && <ChevronRight className="w-5 h-5 ml-1" />}
        </Button>
      </div>
    </div>
  );
}

export default function JourneyLandingPage(props: PageProps) {
  return (
    <Suspense>
      <JourneyLandingContent params={props.params} />
    </Suspense>
  );
}
