/**
 * FILE: app/(auth)/journeys/page.tsx
 *
 * PURPOSE:
 *   Two-tab journeys page: "Explore" shows the discovery catalogue (featured hero +
 *   2-col quick picks, premium-first, enrolled journeys filtered out); "My Journeys"
 *   shows the user's enrolled journeys as a full-width vertical list.
 *
 * LOGIC OVERVIEW:
 *   1. Fetch all published journeys (useJourneys) and user enrollments (useEnrolledJourneys).
 *   2. Build journeyMap (id → JourneyItem) to cross-reference null name/icon in enrollments.
 *   3. enrichedEnrollments merges enrollment data with CMS name/icon/isPremium/totalDays.
 *   4. enrolledIds Set is used to filter enrolled journeys out of the discovery list.
 *   5. Discovery list is filtered by search + category, then sorted premium-first.
 *   6. Two tabs: "explore" (default) and "mine". Tab trigger shows enrollment count badge.
 *   7. "My Journeys" tab: vertical JourneyCard list, skeleton loading, empty state with CTA.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   activeTab           — 'explore' | 'mine'; controls which tab is visible
 *   enrichedEnrollments — JourneyProgress[] merged with CMS data for display
 *   enrolledIds         — Set<string> of journeyIds already enrolled
 *   sortedFiltered      — discovery list after filter + premium-first sort
 *   featuredJourney     — first item in sortedFiltered; shown as hero card
 *   quickPicks          — items 1–10 in sortedFiltered; shown as 2-col grid
 *
 * DEPENDENCIES:
 *   useJourneys()           — hooks/journeys/use-journeys-page.ts
 *   useEnrolledJourneys()   — hooks/journeys/use-journey-detail.ts
 *   JourneyCard             — components/journey/journey-card.tsx
 *   FeaturedJourneyCard     — components/journey/featured-journey-card.tsx
 *   JourneyDiscoveryCard    — components/journey/journey-discovery-card.tsx
 *   CategoryChips           — components/journey/category-chips.tsx
 *   shadcn Tabs             — components/ui/tabs.tsx
 *
 * LAST UPDATED: 2026-04-16 — redesigned to two-tab layout (Explore / My Journeys)
 */
'use client';

import { useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecommendationBanner } from '@/components/journey/recommendation-banner';
import { CategoryChips } from '@/components/journey/category-chips';
import { FeaturedJourneyCard } from '@/components/journey/featured-journey-card';
import { JourneyDiscoveryCard } from '@/components/journey/journey-discovery-card';
import { JourneyCard } from '@/components/journey/journey-card';
import { useJourneys } from '@/hooks/journeys/use-journeys-page';
import { useEnrolledJourneys } from '@/hooks/journeys/use-journey-detail';
import { useAuth } from '@/hooks/shared/auth/use-auth';
import { extractJourneyName, extractJourneyDescription } from '@/types/journey';
import { BackButton } from '@/components/shared/navigation/back-button';

// Firebase-based assessment category lookup removed — now always returns null
// until a backend-v2 equivalent is implemented
function useLatestAssessmentCategory(_mobile: string | null): string | null {
  return null;
}

function JourneysInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const mobile = (user as Record<string, unknown>)?.caller_mobile as
    | string
    | undefined;

  const [activeTab, setActiveTab] = useState<'explore' | 'mine'>('explore');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(
    searchParams?.get('category') ?? 'All'
  );

  const { journeys, isLoading: loadingJourneys } = useJourneys();
  const { enrollments, isLoading: loadingEnrolled } = useEnrolledJourneys();
  const recommendedCategory = useLatestAssessmentCategory(mobile ?? null);

  const isLoading = loadingJourneys || loadingEnrolled;

  // Lookup map: CMS journey id → JourneyItem (for cross-referencing null name/icon)
  const journeyMap = useMemo(
    () => new Map(journeys.map((j) => [j.id, j])),
    [journeys]
  );

  // Set of journey IDs the user is already enrolled in — hidden from discovery
  const enrolledIds = useMemo(
    () => new Set(enrollments.map((e) => e.journeyId)),
    [enrollments]
  );

  // Merge enrollment data with CMS journey data to fill in null name/icon/isPremium/totalDays
  const enrichedEnrollments = useMemo(
    () =>
      enrollments.map((e) => {
        const cms = journeyMap.get(e.journeyId);
        if (!cms) return e;
        return {
          ...e,
          name: e.name || extractJourneyName(cms.name),
          icon: e.icon ?? cms.icon ?? undefined,
          isPremium: cms.isPremium,
          totalDays: e.totalDays || cms.steps.length,
        };
      }),
    [enrollments, journeyMap]
  );

  // Derive unique categories from actual journey data
  const categories = useMemo(() => {
    const gradeSet = new Set<string>();
    journeys.forEach((j) => (j.grade ?? []).forEach((g) => gradeSet.add(g)));
    return ['All', ...Array.from(gradeSet).sort()];
  }, [journeys]);

  // Filter: remove enrolled, apply grade + text search, then sort premium first
  const sortedFiltered = useMemo(() => {
    const filtered = journeys.filter((j) => {
      if (enrolledIds.has(j.id)) return false;

      const name = extractJourneyName(j.name).toLowerCase();
      const desc = extractJourneyDescription(j.description).toLowerCase();
      const haystack = `${name} ${desc}`;

      const matchSearch = !search || haystack.includes(search.toLowerCase());
      const matchCat =
        activeCategory === 'All' ||
        (j.grade ?? []).includes(activeCategory) ||
        haystack.includes(activeCategory.toLowerCase());

      return matchSearch && matchCat;
    });

    // Premium journeys first, non-premium after
    return [...filtered].sort((a, b) => {
      if (a.isPremium === b.isPremium) return 0;
      return a.isPremium ? -1 : 1;
    });
  }, [journeys, enrolledIds, search, activeCategory]);

  const featuredJourney = sortedFiltered[0] ?? null;
  const quickPicks = sortedFiltered.slice(1, 11);

  const recommendedCount = useMemo(() => {
    if (!recommendedCategory) return 0;
    return journeys.filter(
      (j) =>
        (j.grade ?? []).includes(recommendedCategory) ||
        extractJourneyName(j.name)
          .toLowerCase()
          .includes(recommendedCategory.toLowerCase())
    ).length;
  }, [journeys, recommendedCategory]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'explore' | 'mine')}
      className="flex flex-col min-h-screen bg-background"
    >
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 px-4 pt-5 pb-3">
          <BackButton fallback="/" />
          <h1 className="flex-1 text-lg font-bold text-foreground">Journeys</h1>
        </div>
        <div className="px-4 pb-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="mine" className="relative">
              My Journeys
              {!loadingEnrolled && enrichedEnrollments.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center"
                >
                  {enrichedEnrollments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
      </header>

      <main className="flex-1 pb-24">
        {/* ── Explore tab ── */}
        <TabsContent value="explore" className="mt-0">
          {/* Recommendation banner */}
          {recommendedCategory && recommendedCount > 0 && (
            <div className="px-4 mb-3">
              <RecommendationBanner
                category={recommendedCategory}
                count={recommendedCount}
                onPress={() => setActiveCategory(recommendedCategory)}
              />
            </div>
          )}

          {/* Category chips */}
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

          {/* Search bar */}
          <div className="px-4 mb-5">
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

          <div className="px-4">
            {/* Featured Journey */}
            <section className="mb-6">
              <h2 className="text-base font-bold text-foreground mb-3">
                Featured Journey
              </h2>
              {isLoading ? (
                <Skeleton className="w-full h-[220px] rounded-2xl" />
              ) : featuredJourney ? (
                <FeaturedJourneyCard journey={featuredJourney} />
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No journeys found.
                </p>
              )}
            </section>

            {/* Quick Picks */}
            {(isLoading || quickPicks.length > 0) && (
              <section>
                <h2 className="text-base font-bold text-foreground mb-3">
                  {search || activeCategory !== 'All' ? 'Results' : 'Quick Picks'}
                </h2>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {quickPicks.map((journey) => (
                      <JourneyDiscoveryCard key={journey.id} journey={journey} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </TabsContent>

        {/* ── My Journeys tab ── */}
        <TabsContent value="mine" className="mt-0 px-4">
          {loadingEnrolled ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : enrichedEnrollments.length > 0 ? (
            <div className="space-y-3 pt-2">
              {enrichedEnrollments.map((enrollment) => (
                <JourneyCard key={enrollment.enrollmentId} journey={enrollment} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <MapIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No journeys yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Start a journey to track your progress and build healthy habits.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveTab('explore')}
              >
                Explore Journeys
              </Button>
            </div>
          )}
        </TabsContent>
      </main>
    </Tabs>
  );
}

export default function JourneysIndexPage() {
  return (
    <Suspense fallback={null}>
      <JourneysInner />
    </Suspense>
  );
}
