/**
 * FILE: app/(auth)/journeys/[id]/page.tsx
 *
 * PURPOSE:
 *   Journey landing/detail page. Displays a single journey's hero image, stats,
 *   rich-text description (Strapi blocks), and a CTA to subscribe or continue.
 *
 * LOGIC OVERVIEW:
 *   1. Resolves the journey ID from route params.
 *   2. Fetches journey detail and subscription progress via SWR hooks.
 *   3. Shows a skeleton while loading; shows error state if not found.
 *   4. Renders hero image, badge, title, BlocksRenderer description, stats row,
 *      and step highlights.
 *   5. Fixed CTA row: Preview + Subscribe. For PREMIUM journeys, the
 *      "Subscribe to Premium" button is golden and routes the user to
 *      /packages/browse/<packageId> (the package purchase flow). For FREE
 *      journeys it enrolls directly and navigates to /journeys/[id]/details.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   id              — journey ID from URL params
 *   journey         — full journey object from useJourneyDetail
 *   progress        — subscription/progress object from useJourneyProgress
 *   isSubscribed    — true when progress record exists
 *   subscribing     — local loading flag while subscribeToJourney runs
 *
 * DEPENDENCIES:
 *   useJourneyDetail(id)    — SWR hook for journey data
 *   useJourneyProgress(id)  — SWR hook for user progress
 *   subscribeToJourney      — mutation to enroll user
 *   BlocksRenderer          — @strapi/blocks-react-renderer for rich-text
 *
 * LAST UPDATED: 2026-04-27 — fixed header not sticking: outer container changed from min-h-screen to h-screen so the inner overflow-y-auto div is the true scroll container and the header stays pinned above it
 */

"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  subscribeToJourney,
  useJourneyDetail,
  useJourneyProgress,
} from "@/hooks/journeys/use-journey-detail";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { hapticMedium } from "@/lib/haptics";
import { fixImageUrl } from "@/lib/utils";
import { extractJourneyName } from "@/types/journey";
import { type BlocksContent, BlocksRenderer } from "@strapi/blocks-react-renderer";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Layers,
  Timer,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

function JourneyLandingContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const mobile =
    (
      ((user as Record<string, unknown>)?.caller_mobile as string | undefined) ??
      ((user as Record<string, unknown>)?.phone_number as string | undefined)
    )?.replace(/\D/g, "") ?? null;

  const { journey, isLoading } = useJourneyDetail(id);
  const { progress, isLoading: progLoad } = useJourneyProgress(id);
  const [subscribing, setSubscribing] = useState(false);

  // Already-enrolled users skip this landing page entirely and go straight
  // to the interactive details view.
  const isSubscribedRedirect = !!progress;
  useEffect(() => {
    if (!progLoad && isSubscribedRedirect) {
      router.replace(`/journeys/${id}/details`);
    }
  }, [progLoad, isSubscribedRedirect, id, router]);

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
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
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
  const imageUrl = fixImageUrl(journey.icon);
  const isSubscribed = !!progress;
  const stepCount = journey.steps?.length ?? 0;
  const taskCount = (journey.steps ?? []).reduce((a, s) => a + (s.tasks?.length ?? 0), 0);
  const months = Math.max(1, Math.round(stepCount / 30));

  // Derive highlights from step titles (first 3)
  const highlights = (journey.steps ?? [])
    .slice(0, 3)
    .map((s) =>
      (typeof s.title === "string" ? s.title : extractJourneyName(s.title as never))
        .replace(/^Day\s*\d+\s*[:\-·]?\s*/i, "")
        .trim(),
    )
    .filter(Boolean);

  // Premium journeys: users MUST purchase the linked package before they can
  // attempt any task (not even Day 1 is free once the journey is gated
  // behind a package). The Subscribe CTA therefore hands them off to the
  // package browse flow. Free journeys keep the auto-enroll + redirect path.
  async function handleSubscribe() {
    if (!mobile) {
      router.push("/auth/login");
      return;
    }
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
      router.push(`/journeys/${id}/details`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubscribing(false);
    }
  }

  function handlePreview() {
    router.push(`/journeys/${id}/details`);
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        title=""
        fallback="/journeys"
        className="border-b border-border bg-background/90 backdrop-blur-sm px-4 py-2"
      />

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
              {journey.isPremium ? "Premium Journey" : "Free Journey"}
            </p>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground leading-tight">{name}</h1>

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
                  {months} {months === 1 ? "Month" : "Months"}
                </p>
                <p className="text-[11px] text-muted-foreground">Duration</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {journey.description && (journey.description as unknown[]).length > 0 && (
            <div className="prose prose-sm prose-muted max-w-none text-muted-foreground">
              <BlocksRenderer content={journey.description as unknown as BlocksContent} />
            </div>
          )}

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

          <Separator />

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center italic pb-2">
            This journey is for personal growth and wellness purposes and does not replace
            professional medical or psychological advice.
          </p>
        </div>
      </div>

      {/* CTA — Preview + Subscribe side-by-side for unenrolled users.
          Premium journeys show a golden "Subscribe to Premium" button that
          routes to the package browse flow — users cannot attempt any task
          (including Day 1) without purchasing the linked package. */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-background border-t border-border">
        {journey.isPremium && !isSubscribed && (
          <p className="text-[11px] text-muted-foreground text-center mb-3">
            Preview the full journey · Subscribe to unlock tasks
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-14 rounded-2xl font-semibold text-base border-2"
            disabled={subscribing}
            onClick={handlePreview}
          >
            Preview
          </Button>
          {journey.isPremium ? (
            <button
              type="button"
              disabled={subscribing}
              onClick={handleSubscribe}
              className={
                "relative h-14 rounded-2xl font-bold text-base text-white " +
                "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 " +
                "shadow-[0_8px_20px_-6px_rgba(217,119,6,0.55)] " +
                "ring-1 ring-amber-300/60 " +
                "hover:brightness-105 active:scale-[0.98] transition " +
                "flex items-center justify-center gap-2 " +
                (subscribing ? "opacity-70 cursor-not-allowed" : "")
              }
            >
              <Crown className="w-4 h-4 drop-shadow-sm" />
              <span className="tracking-tight">Subscribe</span>
            </button>
          ) : (
            <Button
              className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-md shadow-primary/30"
              disabled={subscribing}
              onClick={handleSubscribe}
            >
              {subscribing ? "Please wait..." : "Subscribe"}
              {!subscribing && <ChevronRight className="w-5 h-5 ml-0.5" />}
            </Button>
          )}
        </div>
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
