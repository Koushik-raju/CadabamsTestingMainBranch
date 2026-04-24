/**
 * FILE: components/home/growth-widget.tsx
 *
 * PURPOSE:
 *   Minimal home-page teaser for Growth. Shows the 7-day Mon→Sun strip
 *   with a dot under each day that has any activity. Every cell is its
 *   own link so tapping a date opens /growth?date=YYYY-MM-DD and lands
 *   on that exact day — no state round-tripping.
 *
 * LOGIC OVERVIEW:
 *   1. Fetch useGrowthWeek(today) for the 7-day activity flags.
 *   2. Each day cell is a <Link> to /growth?date=<iso>.
 *   3. The header "View all →" link hands off without a date, so /growth
 *      falls back to its best-default-date auto-jump.
 *   4. While loading, renders skeleton cells so the card height is stable.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   GrowthWidget (default export) — no props.
 *
 * DEPENDENCIES:
 *   useGrowthWeek, todayIso (hooks/growth/use-growth)
 *   shadcn Card + Skeleton, lucide icons, next/link
 *
 * LAST UPDATED: 2026-04-23 — strip widget back to week-strip only;
 *   each cell hands off its date via ?date= so clicks land on the tapped day.
 */
'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { todayIso, useGrowthWeek } from '@/hooks/growth/use-growth';

const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function GrowthWidget() {
  const today = todayIso();
  const { user } = useAuth();
  const firstName = ((user?.name as string | undefined) ?? '').split(' ')[0];
  const { week, isLoading } = useGrowthWeek(today);

  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-lg font-bold">
            {firstName ? (
              <>
                {firstName}
                <span className="text-muted-foreground font-semibold">
                  &apos;s growth
                </span>
              </>
            ) : (
              'Your Growth'
            )}
          </h3>
        </div>
        <Link href="/growth" className="text-sm font-semibold text-primary">
          View All
        </Link>
      </div>

      <Card>
        <CardContent className="py-3 px-3">
          <div className="grid grid-cols-7 gap-1">
            {(isLoading || !week
              ? (Array.from({ length: 7 }) as undefined[])
              : week.days
            ).map((d, i) => {
              const iso = d?.date;
              const isToday = iso === today;
              const active =
                d &&
                (d.hasJourney || d.hasJournal || d.hasAssessment || d.hasChatSummary);
              const cell = (
                <div className="flex flex-col items-center gap-1 py-1">
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      isToday ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {DOW_LABELS[i]}
                  </span>
                  {iso ? (
                    <span
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : active
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground',
                      )}
                    >
                      {Number(iso.slice(8, 10))}
                    </span>
                  ) : (
                    <Skeleton className="h-8 w-8 rounded-full" />
                  )}
                  <span
                    className={cn(
                      'w-1 h-1 rounded-full',
                      active && !isToday ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                </div>
              );

              return iso ? (
                <Link
                  key={iso}
                  href={`/growth?date=${iso}`}
                  className="rounded-lg transition-colors hover:bg-muted/50 active:bg-muted"
                >
                  {cell}
                </Link>
              ) : (
                <div key={i}>{cell}</div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
