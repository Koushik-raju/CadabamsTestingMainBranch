'use client';

import { use, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Clock, Lock, Sparkles } from 'lucide-react';
import { BackButton } from '@/components/common/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { JourneyDayList } from '@/components/journey/journey-day-list';
import { PremiumBadge } from '@/components/journey/premium-badge';
import type { JourneyDayItem } from '@/components/journey/journey-day-list';

const STRAPI_BASE = 'https://mindtalkbuddy.com';

interface StrapiJourneyDay {
  dayNumber?: number;
  journeyTitle?: string;
  [key: string]: unknown;
}

interface StrapiJourney {
  documentId?: string;
  id?: string | number;
  name?: string | unknown;
  description?: string | unknown;
  isPremium?: boolean;
  icon?: { url?: string };
  banner?: { url?: string };
  journey?: StrapiJourneyDay[];
}

function getSafeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (!val) return '';
  if (typeof val === 'object') {
    const o = val as Record<string, unknown>;
    return String(o.name ?? o.title ?? o.text ?? '');
  }
  return String(val);
}

function fixImageUrl(url: unknown): string {
  if (!url || typeof url !== 'string') return '/journey/default.png';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/uploads/')) return `${STRAPI_BASE}${url}`;
  return url;
}

async function fetchJourneyDetail(id: string): Promise<StrapiJourney | null> {
  const res = await fetch(
    `${STRAPI_BASE}/api/mindful-journeys?filters[documentId][$eq]=${id}&populate=journey&populate=icon`
  );
  if (!res.ok) return null;
  const data = await res.json() as { data?: StrapiJourney[] };
  return data.data?.[0] ?? null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function JourneyDetailContent({ params }: PageProps) {
  const { id: journeyId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('isPreview') === 'true';

  const [journey, setJourney] = useState<StrapiJourney | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourneyDetail(journeyId)
      .then(setJourney)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [journeyId]);

  const days: JourneyDayItem[] = (journey?.journey ?? []).map((day, idx) => ({
    dayNumber: day.dayNumber ?? idx + 1,
    unlocked: idx === 0, // Only first day is unlocked in preview
    available: idx === 0,
    completed: false,
    title: day.journeyTitle ?? `Day ${day.dayNumber ?? idx + 1}`,
  }));

  const name = getSafeString(journey?.name);
  const description = getSafeString(journey?.description);
  const imageUrl = fixImageUrl(journey?.icon?.url ?? journey?.banner?.url);
  const isPremium = journey?.isPremium ?? false;
  const totalDays = days.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[220px] w-full">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="px-4 pt-5 flex flex-col gap-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-muted-foreground">Journey not found.</p>
        <BackButton fallback="/journey" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero image */}
      <div className="relative h-[220px] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute top-4 left-4 z-10">
          <BackButton fallback="/journey" className="bg-white/20 text-white hover:bg-white/30" />
        </div>
        {isPremium && (
          <div className="absolute top-4 right-4 z-10">
            <PremiumBadge />
          </div>
        )}
      </div>

      {/* Journey info */}
      <div className="px-4 pt-5">
        <h1 className="text-xl font-bold text-foreground mb-2">{name}</h1>

        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            {totalDays} Days
          </Badge>
          {isPremium && (
            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 border-amber-200">
              <Sparkles className="w-3 h-3" />
              Premium
            </Badge>
          )}
        </div>

        {description && (
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">{description}</p>
        )}

        {/* Preview notice */}
        {isPreview && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-semibold text-sm">Preview Mode</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Sign up or log in to track your progress and unlock all days.
              </p>
            </div>
          </div>
        )}

        {/* Start CTA */}
        <Button
          className="w-full mb-6 gap-2"
          onClick={() => router.push('/signup')}
        >
          Start This Journey
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Day list */}
        <h2 className="text-base font-bold text-foreground mb-3">
          Journey Days
        </h2>
        {days.length > 0 ? (
          <JourneyDayList
            days={days}
            onDayClick={() => router.push('/signup')}
          />
        ) : (
          <p className="text-muted-foreground text-sm text-center py-6">
            No days available yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default function PublicJourneyDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Skeleton className="h-[220px] w-full rounded-none" />
          <div className="px-4 pt-5 flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      }
    >
      <JourneyDetailContent params={params} />
    </Suspense>
  );
}
