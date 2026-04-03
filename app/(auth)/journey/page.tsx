'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { JourneyCard } from '@/components/journey/journey-card';
import { JourneyDiscoveryCard } from '@/components/journey/journey-discovery-card';
import { useAuth } from '@/hooks/use-auth';
import type { ActiveJourney } from '@/components/journey/journey-card';
import type { DiscoveryJourney } from '@/components/journey/journey-discovery-card';

const CATEGORIES = ['All', 'Anxiety', 'Sleep', 'Depression', 'Stress', 'Focus'];

const STRAPI_BASE = 'https://mindtalkbuddy.com';

async function fetchAllJourneys(): Promise<DiscoveryJourney[]> {
  const res = await fetch(
    `${STRAPI_BASE}/api/mindful-journeys?populate=icon&pagination[pageSize]=50&_t=${Date.now()}`
  );
  if (!res.ok) return [];
  const data = await res.json() as { data?: DiscoveryJourney[] };
  return data.data ?? [];
}

export default function AuthJourneyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeJourneys, setActiveJourneys] = useState<ActiveJourney[]>([]);
  const [allJourneys, setAllJourneys] = useState<DiscoveryJourney[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  // Fetch user's active journeys from Firebase
  const fetchActiveJourneys = useCallback(async () => {
    const mobile = (user as Record<string, unknown>)?.caller_mobile as string | undefined;
    if (!mobile) {
      setLoadingActive(false);
      return;
    }
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const { database } = await import('@/lib/firebase');
      const { ref, get } = await import('firebase/database');
      const journeysRef = ref(database, `userJourneysMobile/${cleanMobile}/journeys`);
      const snapshot = await get(journeysRef);
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, ActiveJourney>;
        const list = Object.values(data).sort((a, b) => {
          const aTime = new Date(a.lastUpdated ?? 0).getTime();
          const bTime = new Date(b.lastUpdated ?? 0).getTime();
          return bTime - aTime;
        });
        setActiveJourneys(list);
      }
    } catch (err) {
      console.error('Error fetching active journeys:', err);
    } finally {
      setLoadingActive(false);
    }
  }, [user]);

  const fetchJourneys = useCallback(async () => {
    try {
      const journeys = await fetchAllJourneys();
      setAllJourneys(journeys);
    } catch (err) {
      console.error('Error fetching journeys:', err);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveJourneys();
    fetchJourneys();
  }, [fetchActiveJourneys, fetchJourneys]);

  const handleSubscribe = async (journey: DiscoveryJourney) => {
    const mobile = (user as Record<string, unknown>)?.caller_mobile as string | undefined;
    if (!mobile) {
      router.push('/login');
      return;
    }
    const jId = journey.documentId ?? journey.id;
    try {
      setSubscribingId(jId);
      const cleanMobile = mobile.replace(/\D/g, '');
      const { database } = await import('@/lib/firebase');
      const { ref, set } = await import('firebase/database');
      const journeyRef = ref(database, `userJourneysMobile/${cleanMobile}/journeys/${jId}`);
      await set(journeyRef, {
        journeyId: jId,
        name: typeof journey.name === 'string' ? journey.name : '',
        startDate: new Date().toISOString(),
        currentDay: 1,
        totalDays: (journey.journey?.length ?? journey.days?.length) ?? 30,
        streak: 0,
        isPremium: journey.isPremium ?? false,
        progress: 0,
        lastUpdated: new Date().toISOString(),
      });
      router.push(`/journey/${jId}?day=1`);
    } catch (err) {
      console.error('Error subscribing to journey:', err);
    } finally {
      setSubscribingId(null);
    }
  };

  const subscribedIds = new Set(activeJourneys.map((j) => j.journeyId));

  const filteredJourneys = allJourneys.filter((j) => {
    const name = typeof j.name === 'string' ? j.name.toLowerCase() : '';
    const matchSearch = name.includes(searchQuery.toLowerCase());
    const matchCategory =
      activeCategory === 'All' ||
      (typeof j.category === 'string' && j.category.includes(activeCategory)) ||
      name.includes(activeCategory.toLowerCase());
    return matchSearch && matchCategory;
  });

  const featuredJourney = allJourneys.find((j) => j.isFeatured) ?? allJourneys[0];
  const quickPicks = filteredJourneys
    .filter((j) => j.documentId !== featuredJourney?.documentId)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">My Journeys</h1>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5"
          onClick={() => router.push('/journey/explore')}
        >
          <Compass className="w-4 h-4" />
          Explore
        </Button>
      </div>

      {/* Active Journeys */}
      <section className="px-4 mb-6">
        {loadingActive ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-[90px] w-full rounded-xl" />
            ))}
          </div>
        ) : activeJourneys.length > 0 ? (
          <div className="flex flex-col gap-3">
            {activeJourneys.map((journey) => (
              <JourneyCard key={journey.journeyId} journey={journey} />
            ))}
          </div>
        ) : (
          <div className="bg-muted rounded-2xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              You haven&apos;t started any journeys yet.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Explore below and start your first journey!
            </p>
          </div>
        )}
      </section>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search journeys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="relative mb-4">
        <div className="flex gap-2 overflow-x-auto px-4 py-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'bg-foreground border-foreground text-background shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      <div className="px-4">
        {/* Featured Journey */}
        {!loadingAll && featuredJourney && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-foreground mb-3">Featured</h2>
            <JourneyDiscoveryCard
              journey={featuredJourney}
              featured={true}
              isSubscribed={subscribedIds.has(featuredJourney.documentId ?? featuredJourney.id)}
              onSubscribe={handleSubscribe}
              isSubscribing={subscribingId === (featuredJourney.documentId ?? featuredJourney.id)}
            />
          </section>
        )}

        {/* Quick Picks */}
        <section>
          <h2 className="text-base font-bold text-foreground mb-3">
            {searchQuery || activeCategory !== 'All' ? 'Results' : 'Quick Picks'}
          </h2>
          {loadingAll ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
              ))}
            </div>
          ) : quickPicks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {quickPicks.map((journey) => (
                <JourneyDiscoveryCard
                  key={journey.documentId ?? journey.id}
                  journey={journey}
                  isSubscribed={subscribedIds.has(journey.documentId ?? journey.id)}
                  onSubscribe={handleSubscribe}
                  isSubscribing={subscribingId === (journey.documentId ?? journey.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-8">
              No journeys found.
            </p>
          )}
        </section>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
