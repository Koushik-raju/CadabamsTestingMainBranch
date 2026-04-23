/**
 * FILE: components/home/growth-widget.tsx
 *
 * PURPOSE:
 *   Home-screen teaser for the Growth page. Shows four compact tiles —
 *   journey activity, journals, assessments, chat summary — with the
 *   count of items recorded today and links to /growth for the full view.
 *
 * LOGIC OVERVIEW:
 *   1. Pulls today's aggregated feed via useGrowthDay(today).
 *   2. Derives a count per source (0 is rendered as a dash).
 *   3. Entire card is a Link to /growth; inner tiles are visual only.
 *   4. While loading, renders skeleton tiles; if the request errors
 *      we silently fall back to zeros so the home page never breaks.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   GrowthWidget (default export) — no props, self-contained.
 *
 * DEPENDENCIES:
 *   useGrowthDay (hooks/growth/use-growth)
 *   shadcn Card, Skeleton
 *   lucide-react icons
 *
 * LAST UPDATED: 2026-04-23 — initial implementation
 */
'use client';

import Link from 'next/link';
import {
  BookOpen,
  ClipboardCheck,
  MessageSquareText,
  Route,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  todayIso,
  useGrowthDay,
  useGrowthLatestActiveDate,
} from '@/hooks/growth/use-growth';

interface Tile {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

export function GrowthWidget() {
  const today = todayIso();
  // Prefer today. If today has no activity, fall back to the patient's
  // most recent active date so dormant users still see something on the
  // home screen instead of four dashes.
  const { day: todayDay, isLoading: todayLoading, error: todayError } = useGrowthDay(today);
  const { latest, isLoading: latestLoading } = useGrowthLatestActiveDate();

  const todayHasData =
    !!todayDay &&
    (todayDay.journeys.length +
      todayDay.journals.length +
      todayDay.assessments.length +
      todayDay.chatSummaries.length >
      0);

  const fallbackDate = !todayHasData && latest && latest !== today ? latest : null;
  const { day: fallbackFetched, isLoading: fallbackLoading } = useGrowthDay(
    fallbackDate ?? today,
  );

  const activeDay = fallbackDate ? fallbackFetched : todayDay;
  const activeDate = fallbackDate ?? today;
  const isLoading = todayLoading || latestLoading || (!!fallbackDate && fallbackLoading);
  const safe = todayError ? undefined : activeDay;

  const tiles: Tile[] = [
    {
      label: 'Journey',
      count: safe?.journeys.length ?? 0,
      icon: Route,
      accent: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Journals',
      count: safe?.journals.length ?? 0,
      icon: BookOpen,
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Assess.',
      count: safe?.assessments.length ?? 0,
      icon: ClipboardCheck,
      accent: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Chat',
      count: safe?.chatSummaries.length ?? 0,
      icon: MessageSquareText,
      accent: 'from-sky-500 to-blue-600',
    },
  ];

  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-lg font-bold">Your Growth</h3>
        </div>
        <Link href="/growth" className="text-sm font-semibold text-primary">
          View All
        </Link>
      </div>

      <Link href="/growth" className="block">
        <Card className="transition-colors hover:bg-muted/40 active:bg-muted/60">
          <CardContent className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="flex flex-col items-center gap-1.5 py-2"
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                      tile.accent,
                    )}
                  >
                    <tile.icon className="w-4 h-4 text-white" />
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-3 w-6 rounded" />
                  ) : (
                    <span className="text-sm font-bold text-foreground">
                      {tile.count > 0 ? tile.count : '—'}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {tile.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {fallbackDate
                ? `Most recent activity · ${activeDate}`
                : 'Activity recorded today · tap to see the week'}
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
