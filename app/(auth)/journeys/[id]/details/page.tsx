/**
 * FILE: app/(auth)/journeys/[id]/details/page.tsx
 *
 * PURPOSE:
 *   Enrolled journey details page. Renders the path view once the CMS journey
 *   structure and the user's enrollment record are both loaded.
 *
 * LOGIC OVERVIEW:
 *   Resolves the journey id, fetches CMS detail + enrollment via SWR hooks.
 *   useJourneyProgress passes preview=true so GET never auto-enrolls; enrollment
 *   only happens when the user explicitly taps the subscribe CTA in
 *   JourneyPathView. Unsubscribed users see the preview/locked UI.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   journey     — CMS JourneyItem
 *   progress    — PatientJourneyResponseDto | null
 *   isSubscribed — derived from `progress`
 *
 * DEPENDENCIES:
 *   useJourneyDetail, useJourneyProgress — hooks/journeys/use-journey-detail
 *   JourneyPathView — components/journey/journey-path-view
 *   PageHeader — shared navigation header
 *
 * LAST UPDATED: 2026-05-08 — Removed JourneyCooldownBanner from subHeader; next day now unlocks immediately (no cooldown)
 */
"use client";

import { Crown, MoreVertical, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, use, useState } from "react";
import { JourneyPathView, StatsBar } from "@/components/journey/journey-path-view";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  subscribeToJourney,
  useJourneyDetail,
  useJourneyProgress,
} from "@/hooks/journeys/use-journey-detail";
import { hapticMedium } from "@/lib/haptics";
import { extractJourneyName } from "@/types/journey";

interface PageProps {
  params: Promise<{ id: string }>;
}

function DetailsContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [subscribing, setSubscribing] = useState(false);

  const { journey, isLoading } = useJourneyDetail(id);
  const { progress, isLoading: progLoad } = useJourneyProgress(id);

  console.log("[DetailsPage] render", {
    id,
    journeyLoading: isLoading,
    progressLoading: progLoad,
    hasJourney: !!journey,
    hasProgress: !!progress,
    progressId: progress?.id,
  });

  if (isLoading || progLoad) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-2 px-4 py-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="px-4 flex flex-col items-center gap-6 pt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-14 h-14 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Journey not found.</p>
        <Button variant="outline" onClick={() => router.replace("/journeys")}>
          Go Back
        </Button>
      </div>
    );
  }

  const name = extractJourneyName(journey.name);
  const isSubscribed = !!progress;

  // Premium journeys: enrollment happens automatically on the backend when
  // the user purchases the linked package. The frontend must never call
  // subscribeToJourney for premium — this CTA routes to the package page.
  async function handleSubscribeFromLock() {
    if (journey!.isPremium) {
      hapticMedium();
      const pkgId = journey!.packageId;
      router.push(pkgId ? `/packages/browse/${pkgId}` : "/packages");
      return;
    }
    setSubscribing(true);
    try {
      await subscribeToJourney(journey!);
      hapticMedium();
    } catch (e) {
      console.error(e);
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--primary) / 0.14) 0%, hsl(var(--primary) / 0.04) 22%, hsl(var(--background)) 45%, hsl(var(--background)) 82%, hsl(var(--primary) / 0.05) 100%)",
      }}
    >
      <PageHeader
        title={name}
        subtitle={journey.isPremium ? "Premium Journey" : undefined}
        fallback="/journeys"
        className="z-20 bg-card/70 backdrop-blur-sm border-b border-border px-4 pb-3"
        right={
          isSubscribed ? (
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          ) : undefined
        }
      >
        {isSubscribed && progress ? <StatsBar progress={progress} /> : undefined}
      </PageHeader>

      <JourneyPathView journey={journey} progress={progress} journeyId={id} />

      {/* Unenrolled users browse the full journey structure in preview mode.
          Premium → golden "Subscribe to Premium" CTA routes to the package
          browse flow (no task is attemptable). Free → primary CTA enrolls. */}
      {!isSubscribed && (
        <div className="fixed bottom-20 left-4 right-4 z-30 sm:left-auto sm:right-6 sm:max-w-sm">
          {journey.isPremium ? (
            <div className="relative overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-3 text-white shadow-[0_12px_32px_-10px_rgba(217,119,6,0.65)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Crown className="h-5 w-5 drop-shadow-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight">Premium journey</p>
                  <p className="text-[11px] text-white/90 mt-0.5">
                    Preview only — subscribe to unlock tasks.
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={subscribing}
                  onClick={handleSubscribeFromLock}
                  className="shrink-0 bg-white text-amber-700 hover:bg-white/90 font-bold"
                >
                  Subscribe
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-primary/80 p-3 text-primary-foreground shadow-[var(--sh-3)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">Subscribe to track progress</p>
                  <p className="text-[11px] text-primary-foreground/85 mt-0.5">
                    Tap Day 1 to try a task, or subscribe now.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={subscribing}
                  onClick={handleSubscribeFromLock}
                  className="shrink-0 bg-white text-primary hover:bg-white/90"
                >
                  {subscribing ? "…" : "Subscribe"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
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
