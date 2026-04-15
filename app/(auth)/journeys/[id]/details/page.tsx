'use client';

import { use, useEffect } from 'react';
import { Suspense } from 'react';
import { MoreVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import { JourneyPathView } from '@/components/journey/journey-path-view';
import { useJourneyDetail, useJourneyProgress, subscribeToJourney } from '@/hooks/journeys/use-journey-detail';
import { useAuth } from '@/hooks/shared/auth/use-auth';
import { extractJourneyName } from '@/types/journey';

interface PageProps { params: Promise<{ id: string }> }

function DetailsContent({ params }: PageProps) {
  const { id }    = use(params);
  const { user }  = useAuth();
  const mobile = (
    ((user as Record<string, unknown>)?.caller_mobile as string | undefined) ??
    ((user as Record<string, unknown>)?.phone_number as string | undefined)
  )?.replace(/\D/g, '') ?? null;

  const { journey,  isLoading }           = useJourneyDetail(id);
  const { progress, isLoading: progLoad } = useJourneyProgress(id);

  // Auto-subscribe free journeys on first visit
  useEffect(() => {
    if (!journey || journey.isPremium || progress || !mobile) return;
    subscribeToJourney(mobile, journey).catch(console.error);
  }, [journey, progress, mobile]);

  if (isLoading || progLoad) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-2 px-4 py-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="px-4 flex flex-col items-center gap-6 pt-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="w-14 h-14 rounded-full" />)}
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Journey not found.</p>
        <BackButton fallback="/journeys" />
      </div>
    );
  }

  const name         = extractJourneyName(journey.name);
  const isSubscribed = !!progress;

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background:
          'linear-gradient(180deg, hsl(var(--primary) / 0.14) 0%, hsl(var(--primary) / 0.04) 22%, hsl(var(--background)) 45%, hsl(var(--background)) 82%, hsl(var(--primary) / 0.05) 100%)',
      }}
    >
      {/* App bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-card/70 backdrop-blur-sm border-b border-border sticky top-0 z-20">
        <BackButton fallback="/journeys" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{name}</p>
          {journey.isPremium && (
            <p className="text-[10px] text-primary font-semibold">Premium Journey</p>
          )}
        </div>
        {isSubscribed && (
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* All path logic lives here */}
      <JourneyPathView
        journey={journey}
        progress={progress}
        mobile={mobile}
        journeyId={id}
      />
    </div>
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense>
      <DetailsContent params={props.params} />
    </Suspense>
  );
}
