/**
 * FILE: components/home/growth-widget.tsx
 *
 * PURPOSE:
 *   Home-page teaser for Growth. Header shows the user's first name and
 *   the visible date range (e.g. "Apr 27 – May 3"). Below it a 7-day
 *   Mon→Sun strip with a coloured dot under each day that has activity,
 *   plus a small footer summary line showing the count of active days
 *   in this week. Every cell deep-links to /growth?date=YYYY-MM-DD.
 *
 * LOGIC OVERVIEW:
 *   1. Fetch useGrowthWeek(today) for the 7-day activity flags + range.
 *   2. Date range derives from week.weekStart/weekEnd — formatted via
 *      Intl.DateTimeFormat with timeZone: UTC because the strings are
 *      already user-tz local dates from the backend.
 *   3. Footer line summarises "{N} active days · {totalSources} sources"
 *      so the user knows there is content to explore even when none of
 *      the dots fall on today.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   GrowthWidget (default export) — no props.
 *
 * DEPENDENCIES:
 *   useGrowthWeek, todayIso (hooks/growth/use-growth)
 *   shadcn Card + Skeleton, lucide icons, next/link
 *
 * LAST UPDATED: 2026-04-27 — added date-range header + activity dots
 *   sized for visibility + footer summary line.
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

/** Format the week range as "Apr 27 – May 3". The ISO strings from the
 *  backend are already user-tz local dates so we render them in UTC to
 *  avoid double-shifting. */
function formatRange(start?: string, end?: string): string {
  if (!start || !end) return '';
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${fmt(s)} – ${fmt(e)}`;
}

export function GrowthWidget() {
  const today = todayIso();
  const { user } = useAuth();
  const firstName = ((user?.name as string | undefined) ?? '').split(' ')[0];
  const { week, isLoading } = useGrowthWeek(today);

  const activeDays = week?.days.filter(
    (d) => d.hasJourney || d.hasJournal || d.hasAssessment || d.hasChatSummary,
  ) ?? [];
  const sourceFlags = week?.days.reduce(
    (acc, d) => ({
      j: acc.j || d.hasJourney,
      n: acc.n || d.hasJournal,
      a: acc.a || d.hasAssessment,
      c: acc.c || d.hasChatSummary,
    }),
    { j: false, n: false, a: false, c: false },
  ) ?? { j: false, n: false, a: false, c: false };
  const sourceCount = Object.values(sourceFlags).filter(Boolean).length;

  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <h3 className="text-lg font-bold truncate">
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
        <Link href="/growth" className="text-sm font-semibold text-primary flex-shrink-0">
          View All
        </Link>
      </div>

      <Card>
        <CardContent className="py-3 px-3">
          {/* Date range — derived from the backend's tz-bucketed week */}
          <div className="flex items-center justify-between mb-3 px-1">
            {isLoading || !week ? (
              <Skeleton className="h-3 w-28 rounded" />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                {formatRange(week.weekStart, week.weekEnd)}
              </span>
            )}
            {!isLoading && week && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {activeDays.length} {activeDays.length === 1 ? 'day' : 'days'} active
              </span>
            )}
          </div>

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
                  {/* 6px dot under active days. The previous 4px dot was
                      almost invisible against the surrounding paddings. */}
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      active && !isToday
                        ? 'bg-primary'
                        : isToday && active
                        ? 'bg-primary'
                        : 'bg-transparent',
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

          {/* Footer summary — reassures that data exists even when no dot
              sits on today's cell. Hidden while loading + when nothing has
              been logged this week (saves vertical space). */}
          {!isLoading && week && activeDays.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                Tap any day to see the details
              </span>
              <span className="text-[11px] font-semibold text-foreground">
                {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
