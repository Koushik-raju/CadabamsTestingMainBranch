/**
 * FILE: app/(auth)/journeys/page.tsx
 *
 * PURPOSE:
 *   Single-view journeys page: swipable featured carousel at the top (enrolled
 *   journeys if any, else top 5 trending) followed by category chips, search,
 *   and a 2-col discovery grid.
 *
 * LOGIC OVERVIEW:
 *   1. Fetch all published journeys (useJourneys) and user enrollments (useEnrolledJourneys).
 *   2. Build journeyMap (id → JourneyItem) to cross-reference null name/icon in enrollments.
 *   3. enrichedEnrollments merges enrollment data with CMS name/icon/isPremium/totalDays.
 *   4. enrolledIds Set filters enrolled journeys out of the discovery list.
 *   5. Discovery list is filtered by search + category, then sorted premium-first.
 *   6. featuredSlides: enrolled → "In Progress" badge + Day X/Y + "Continue →";
 *      otherwise top 5 trending with "Trending" + "Start Now →".
 *   7. quickPicks skips the 5 items already in the trending carousel to avoid
 *      duplicates; when enrolled journeys feed the carousel it uses items 0–9.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   enrichedEnrollments — JourneyProgress[] merged with CMS data for display
 *   enrolledIds         — Set<string> of journeyIds already enrolled
 *   sortedFiltered      — discovery list after filter + premium-first sort
 *   featuredSlides      — FeaturedSlide[] fed into FeaturedJourneyCarousel
 *   quickPicks          — items shown in the 2-col grid, offset to skip carousel items
 *
 * DEPENDENCIES:
 *   useJourneys()           — hooks/journeys/use-journeys-page.ts
 *   useEnrolledJourneys()   — hooks/journeys/use-journey-detail.ts
 *   FeaturedJourneyCarousel — components/journey/featured-journey-carousel.tsx
 *   JourneyDiscoveryCard    — components/journey/journey-discovery-card.tsx
 *   CategoryChips           — components/journey/category-chips.tsx
 *
 * LAST UPDATED: 2026-04-23 — migrated custom header div to PageHeader
 */
"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CategoryChips } from "@/components/journey/category-chips";
import {
  FeaturedJourneyCarousel,
  type FeaturedSlide,
} from "@/components/journey/featured-journey-carousel";
import { JourneyDiscoveryCard } from "@/components/journey/journey-discovery-card";
import { RecommendationBanner } from "@/components/journey/recommendation-banner";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnrolledJourneys } from "@/hooks/journeys/use-journey-detail";
import { useJourneys } from "@/hooks/journeys/use-journeys-page";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { fixImageUrl } from "@/lib/utils";
import { extractJourneyDescription, extractJourneyName } from "@/types/journey";

// Firebase-based assessment category lookup removed — now always returns null
// until a backend-v2 equivalent is implemented
function useLatestAssessmentCategory(_mobile: string | null): string | null {
  return null;
}

function JourneysInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const mobile = (user as Record<string, unknown>)?.caller_mobile as string | undefined;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(searchParams?.get("category") ?? "All");

  const { journeys, isLoading: loadingJourneys } = useJourneys();
  const { enrollments, isLoading: loadingEnrolled } = useEnrolledJourneys();
  const recommendedCategory = useLatestAssessmentCategory(mobile ?? null);

  const isLoading = loadingJourneys || loadingEnrolled;

  const journeyMap = useMemo(() => new Map(journeys.map((j) => [j.id, j])), [journeys]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.journeyId)), [enrollments]);

  const enrichedEnrollments = useMemo(
    () =>
      enrollments.map((e) => {
        const cms = journeyMap.get(e.journeyId);
        const displayName = e.name || (cms ? extractJourneyName(cms.name) : "");
        return {
          enrollmentId: e.id,
          journeyId: e.journeyId,
          name: displayName,
          icon: e.icon ?? cms?.icon ?? undefined,
          isPremium: cms?.isPremium ?? false,
          currentDay: e.currentDay ?? 1,
          totalDays: e.totalDays ?? cms?.steps.length ?? 0,
        };
      }),
    [enrollments, journeyMap],
  );

  const categories = useMemo(() => {
    const gradeSet = new Set<string>();
    journeys.forEach((j) => (j.grade ?? []).forEach((g) => gradeSet.add(g)));
    return ["All", ...Array.from(gradeSet).sort()];
  }, [journeys]);

  const sortedFiltered = useMemo(() => {
    const filtered = journeys.filter((j) => {
      if (enrolledIds.has(j.id)) return false;

      const name = extractJourneyName(j.name).toLowerCase();
      const desc = extractJourneyDescription(j.description).toLowerCase();
      const haystack = `${name} ${desc}`;

      const matchSearch = !search || haystack.includes(search.toLowerCase());
      const matchCat =
        activeCategory === "All" ||
        (j.grade ?? []).includes(activeCategory) ||
        haystack.includes(activeCategory.toLowerCase());

      return matchSearch && matchCat;
    });

    return [...filtered].sort((a, b) => {
      if (a.isPremium === b.isPremium) return 0;
      return a.isPremium ? -1 : 1;
    });
  }, [journeys, enrolledIds, search, activeCategory]);

  const featuredSlides: FeaturedSlide[] = useMemo(() => {
    if (enrichedEnrollments.length > 0) {
      return enrichedEnrollments.map((e) => ({
        key: e.enrollmentId,
        id: e.journeyId,
        name: e.name,
        description: "",
        imageUrl: fixImageUrl(e.icon),
        dayCount: e.totalDays,
        badgeLabel: "In Progress",
        ctaLabel: "Continue →",
        progress: { currentDay: e.currentDay, totalDays: e.totalDays },
      }));
    }
    return sortedFiltered.slice(0, 5).map((j) => ({
      key: j.id,
      id: j.id,
      name: extractJourneyName(j.name),
      description: extractJourneyDescription(j.description),
      imageUrl: fixImageUrl(j.icon),
      dayCount: j.steps?.length ?? 30,
    }));
  }, [enrichedEnrollments, sortedFiltered]);

  const hasEnrolled = enrichedEnrollments.length > 0;
  const quickPicks = hasEnrolled ? sortedFiltered.slice(0, 10) : sortedFiltered.slice(5, 15);

  const recommendedCount = useMemo(() => {
    if (!recommendedCategory) return 0;
    return journeys.filter(
      (j) =>
        (j.grade ?? []).includes(recommendedCategory) ||
        extractJourneyName(j.name).toLowerCase().includes(recommendedCategory.toLowerCase()),
    ).length;
  }, [journeys, recommendedCategory]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Journeys" fallback="/" />

      <main className="flex-1 pb-24">
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search journeys..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>

        {recommendedCategory && recommendedCount > 0 && (
          <div className="px-4 mb-3">
            <RecommendationBanner
              category={recommendedCategory}
              count={recommendedCount}
              onPress={() => setActiveCategory(recommendedCategory)}
            />
          </div>
        )}

        <div className="px-4 mb-5">
          <section className="mb-6">
            <h2 className="text-base font-bold text-foreground mb-3">
              {hasEnrolled ? "Your Journeys" : "Featured Journey"}
            </h2>
            {isLoading ? (
              <Skeleton className="w-full h-[220px] rounded-2xl" />
            ) : featuredSlides.length > 0 ? (
              <FeaturedJourneyCarousel slides={featuredSlides} />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No journeys found.</p>
            )}
          </section>
        </div>

        {loadingJourneys ? (
          <div className="flex gap-2 px-4 mb-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        ) : (
          categories.length > 1 && (
            <div className="mb-4">
              <CategoryChips
                categories={categories}
                active={activeCategory}
                onChange={setActiveCategory}
              />
            </div>
          )
        )}

        <div className="px-4">
          {(isLoading || quickPicks.length > 0) && (
            <section>
              <h2 className="text-base font-bold text-foreground mb-3">
                {search || activeCategory !== "All" ? "Results" : "Quick Picks"}
              </h2>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 space-x-1">
                  {quickPicks.map((journey) => (
                    <div
                      key={journey.id}
                      style={{ contentVisibility: "auto", containIntrinsicSize: "0 180px" }}
                    >
                      <JourneyDiscoveryCard journey={journey} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default function JourneysIndexPage() {
  return (
    <Suspense fallback={null}>
      <JourneysInner />
    </Suspense>
  );
}
