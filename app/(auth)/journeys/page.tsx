'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationBanner } from '@/components/journey/recommendation-banner';
import { CategoryChips } from '@/components/journey/category-chips';
import { FeaturedJourneyCard } from '@/components/journey/featured-journey-card';
import { JourneyDiscoveryCard } from '@/components/journey/journey-discovery-card';
import { useJourneys } from '@/hooks/use-journey';
import { useAuth } from '@/hooks/use-auth';
import { extractJourneyName, extractJourneyDescription } from '@/types/journey';
import { BackButton } from '@/components/shared/navigation/back-button';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

function useLatestAssessmentCategory(mobile: string | null) {
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!mobile) return;
    const cleanMobile = mobile.replace(/\D/g, '');
    get(ref(database, `assessments/${cleanMobile}`))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.val() as Record<string, unknown>;
        if (Object.keys(data).length > 0) setCategory('Anxiety');
      })
      .catch(() => {});
  }, [mobile]);

  return category;
}

function JourneysInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const mobile = (user as Record<string, unknown>)?.caller_mobile as
    | string
    | undefined;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(
    searchParams?.get('category') ?? 'All'
  );

  const { journeys, isLoading } = useJourneys();
  const recommendedCategory = useLatestAssessmentCategory(mobile ?? null);

  // Derive unique categories from actual journey data
  const categories = useMemo(() => {
    const gradeSet = new Set<string>();
    journeys.forEach((j) => (j.grade ?? []).forEach((g) => gradeSet.add(g)));
    return ['All', ...Array.from(gradeSet).sort()];
  }, [journeys]);

  // Filter: grade match (exact) + text search on name + description
  const filtered = useMemo(
    () =>
      journeys.filter((j) => {
        const name = extractJourneyName(j.name).toLowerCase();
        const desc = extractJourneyDescription(j.description).toLowerCase();
        const haystack = `${name} ${desc}`;

        const matchSearch = !search || haystack.includes(search.toLowerCase());
        const matchCat =
          activeCategory === 'All' ||
          (j.grade ?? []).includes(activeCategory) ||
          haystack.includes(activeCategory.toLowerCase());

        return matchSearch && matchCat;
      }),
    [journeys, search, activeCategory]
  );

  const featuredJourney = filtered[0] ?? null;
  const quickPicks = filtered.slice(1, 11);

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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/" />
        <h1 className="flex-1 text-lg font-bold text-foreground">
          Explore Journeys
        </h1>
      </div>

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

      {/* Category chips — loaded from API data */}
      {isLoading ? (
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
