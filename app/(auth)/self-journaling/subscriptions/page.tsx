/**
 * FILE: app/(auth)/self-journaling/subscriptions/page.tsx
 *
 * PURPOSE:
 *   "View All" page for the user's subscribed guided journals (Continue Journey).
 *   Displays every subscription in a 2-column grid with cover images where available.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches all subscriptions via useJournalingSubscriptions().
 *   2. Renders a 2-col grid; each card is a SubscriptionGridCard.
 *   3. SubscriptionGridCard fetches its own SubJournalDetailResponseDto via
 *      useSubJournalDetail(slug) to get the icon URL. SWR caches per slug so
 *      repeat visits are free and the detail calls are already warm from the
 *      journal detail page.
 *   4. Falls back to a gradient tile if detail is loading or icon is null.
 *   5. Shows skeleton grid while the list is loading, empty state when empty.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   subscriptions — SubscriptionWithTitleResponseDto[] from hook
 *
 * DEPENDENCIES:
 *   useJournalingSubscriptions() — hooks/use-journaling-subscriptions.ts
 *   useSubJournalDetail()        — hooks/use-journaling-subscriptions.ts
 *   PageHeader                   — components/shared/navigation/page-header.tsx
 *   getJournalVisual()           — lib/journal-visual.ts
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type SubscriptionWithTitleResponseDto,
  useJournalingSubscriptions,
  useSubJournalDetail,
} from "@/hooks/use-journaling-subscriptions";
import { getJournalVisual } from "@/lib/journal-visual";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Grid Card — fetches its own detail to resolve the icon URL
// ---------------------------------------------------------------------------

function SubscriptionGridCard({
  subscription,
  onClick,
}: {
  subscription: SubscriptionWithTitleResponseDto;
  onClick: () => void;
}) {
  const { gradient, Icon } = getJournalVisual(subscription.title);
  const { sub, isLoading: detailLoading } = useSubJournalDetail(subscription.slug);

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-3xl overflow-hidden text-left shadow-[var(--sh-1)] hover:shadow-[var(--sh-2)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] w-full"
    >
      {/* Image area — show cover if available, gradient tile while loading or as fallback */}
      {sub?.icon ? (
        <div className="h-24 relative overflow-hidden">
          <Image
            src={sub.icon}
            alt={subscription.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        </div>
      ) : detailLoading ? (
        <Skeleton className="h-24 w-full rounded-none" />
      ) : (
        <div
          className={cn(
            "h-24 bg-gradient-to-br flex items-center justify-center relative overflow-hidden",
            gradient,
          )}
        >
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-5 -left-3 w-20 h-20 rounded-full bg-white/5" />
          <Icon className="w-9 h-9 text-white/90 relative z-10" />
        </div>
      )}

      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1">
          {subscription.title}
        </p>
        <p className="text-[10px] text-primary font-medium">Continue →</p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AllSubscriptionsPage() {
  const router = useRouter();
  const { subscriptions, isLoading } = useJournalingSubscriptions();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <PageHeader
        title="My Journeys"
        subtitle="All your subscribed guided journals."
        fallback="/self-journaling"
      />

      <div className="px-4 mt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No journeys yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Subscribe to a guided journal from the home screen.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {subscriptions.map((sub) => (
              <SubscriptionGridCard
                key={sub.id}
                subscription={sub}
                onClick={() => router.push(`/self-journaling/journal/${sub.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
