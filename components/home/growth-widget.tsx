/**
 * FILE: components/home/growth-widget.tsx
 *
 * PURPOSE:
 *   Personalised Growth teaser for the home page. Addresses the user by name,
 *   shows this-week activity dots (Mon→Sun), highlights the best default
 *   date's totals with chips, previews the most recent summary item as
 *   markdown, and offers a single prominent CTA into /growth.
 *
 * LOGIC OVERVIEW:
 *   1. Fetch useGrowthWeek(today) for the 7-day mini-strip dots.
 *   2. Fetch useGrowthLatestActiveDate — "best default date" (most-activity
 *      date, ties broken by recency) to decide which day's preview to show.
 *   3. Fetch useGrowthDay(bestDate) to derive counts + preview text.
 *   4. Derive a preview from the first available item across sources,
 *      rendered through ReactMarkdown with a line-clamp so formatting
 *      renders inline but doesn't break layout.
 *   5. If the user has literally no data, show a warm empty state
 *      pointing to /self-journaling/new so the card always has purpose.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   GrowthWidget (default export)
 *
 * DEPENDENCIES:
 *   useGrowthWeek, useGrowthDay, useGrowthLatestActiveDate
 *   useAuth (first name)
 *   react-markdown, shadcn Card + Skeleton, lucide icons
 *
 * LAST UPDATED: 2026-04-23 — redesigned: personal, richer preview, 7-day strip
 */
'use client';

import Link from 'next/link';
import ReactMarkdown, { type Components } from 'react-markdown';
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  MessageSquareText,
  Route,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  todayIso,
  useGrowthDay,
  useGrowthLatestActiveDate,
  useGrowthWeek,
  type GrowthDay,
} from '@/hooks/growth/use-growth';

const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Collapse markdown blocks to inline so a 2-line clamp never mid-breaks a
 *  heading or list. Inline formatting (bold/italic) still renders. */
const PREVIEW_COMPONENTS: Components = {
  p: ({ children }) => <>{children} </>,
  h1: ({ children }) => <strong>{children} </strong>,
  h2: ({ children }) => <strong>{children} </strong>,
  h3: ({ children }) => <strong>{children} </strong>,
  h4: ({ children }) => <strong>{children} </strong>,
  h5: ({ children }) => <strong>{children} </strong>,
  h6: ({ children }) => <strong>{children} </strong>,
  ul: ({ children }) => <>{children}</>,
  ol: ({ children }) => <>{children}</>,
  li: ({ children }) => <>{children} · </>,
  blockquote: ({ children }) => <>{children} </>,
  hr: () => <> — </>,
  code: ({ children }) => <code>{children}</code>,
  a: ({ children }) => <span className="underline">{children}</span>,
  br: () => <> </>,
};

function formatFriendlyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Pick the most meaningful snippet from a day's payload. Order preference:
 *  chat summary > journey summary > journal entry > assessment analysis. */
function derivePreview(day: GrowthDay | undefined): { label: string; text: string } | null {
  if (!day) return null;
  if (day.chatSummaries[0]?.text) {
    return { label: 'Chat reflection', text: day.chatSummaries[0].text };
  }
  const journey = day.journeys.find((j) => j.summaryText?.trim());
  if (journey && journey.summaryText) {
    return {
      label: `${journey.journeyTitle ?? 'Journey'} · Day ${journey.dayNumber}`,
      text: journey.summaryText,
    };
  }
  if (day.journals[0]?.entryText) {
    return {
      label: day.journals[0].title?.trim() || 'Journal entry',
      text: day.journals[0].entryText,
    };
  }
  if (day.assessments[0]?.analysisMarkdown) {
    return {
      label: day.assessments[0].assessmentTitle ?? day.assessments[0].assessmentKey,
      text: day.assessments[0].analysisMarkdown,
    };
  }
  return null;
}

export function GrowthWidget() {
  const today = todayIso();
  const { user } = useAuth();
  const firstName = ((user?.name as string | undefined) ?? '').split(' ')[0] || 'there';

  const { week, isLoading: weekLoading } = useGrowthWeek(today);
  const { latest, isLoading: latestLoading } = useGrowthLatestActiveDate();

  // Best date to preview — backend's "most-activity" choice if the user has
  // any data, otherwise today. When today itself is the best, skip the
  // second day fetch to save a round trip.
  const bestDate = latest ?? today;
  const { day, isLoading: dayLoading } = useGrowthDay(bestDate);

  const isLoading = weekLoading || latestLoading || dayLoading;
  const hasAnyData = !!latest;

  const totals = {
    journey: day?.journeys.length ?? 0,
    journal: day?.journals.length ?? 0,
    assessment: day?.assessments.length ?? 0,
    chat: day?.chatSummaries.length ?? 0,
  };
  const totalCount =
    totals.journey + totals.journal + totals.assessment + totals.chat;
  const weekActive = week?.days.filter(
    (d) => d.hasJourney || d.hasJournal || d.hasAssessment || d.hasChatSummary,
  ).length ?? 0;

  const preview = derivePreview(day);
  const isBestToday = bestDate === today;

  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-lg font-bold">
            {firstName}
            <span className="text-muted-foreground font-semibold">&apos;s growth</span>
          </h3>
        </div>
        <Link
          href="/growth"
          className="text-xs font-semibold text-primary flex items-center gap-0.5"
        >
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Link href="/growth" className="block group">
        <Card className="overflow-hidden border-border/60 transition-all group-hover:border-primary/40 group-hover:shadow-md group-active:scale-[0.995]">
          <CardContent className="p-0">
            {/* Soft gradient top */}
            <div className="bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 px-4 pt-4 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
                {isBestToday ? "Today's reflection" : 'Most recent reflection'}
              </p>

              {/* Hero line: big count + framing sentence */}
              {isLoading ? (
                <Skeleton className="h-6 w-3/4 rounded" />
              ) : !hasAnyData ? (
                <p className="text-base font-bold text-foreground leading-tight">
                  Ready to start your growth story?
                </p>
              ) : (
                <p className="text-base font-bold text-foreground leading-tight">
                  <span className="text-primary">
                    {totalCount} {totalCount === 1 ? 'moment' : 'moments'}
                  </span>{' '}
                  on {formatFriendlyDate(bestDate)}
                  {weekActive > 0 && (
                    <>
                      {' '}
                      <span className="text-muted-foreground font-medium">
                        · {weekActive} {weekActive === 1 ? 'day' : 'days'} active this
                        week
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* 7-day mini strip */}
            <div className="px-4 pt-3 pb-2">
              <div className="grid grid-cols-7 gap-1">
                {(weekLoading || !week
                  ? (Array.from({ length: 7 }) as undefined[])
                  : week.days
                ).map((d, i) => {
                  const iso = d?.date;
                  const isToday = iso === today;
                  const active =
                    d && (d.hasJourney || d.hasJournal || d.hasAssessment || d.hasChatSummary);
                  return (
                    <div
                      key={iso ?? i}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className={cn(
                          'text-[9px] font-bold uppercase tracking-wider',
                          isToday ? 'text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {DOW_LABELS[i]}
                      </span>
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors',
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : active
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {iso ? Number(iso.slice(8, 10)) : ''}
                      </div>
                      <span
                        className={cn(
                          'w-1 h-1 rounded-full',
                          active && !isToday ? 'bg-primary' : 'bg-transparent',
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Count chips */}
            {!isLoading && hasAnyData && totalCount > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {totals.journey > 0 && (
                  <Chip icon={Route} label="Journey" count={totals.journey} tint="violet" />
                )}
                {totals.chat > 0 && (
                  <Chip
                    icon={MessageSquareText}
                    label="Chat"
                    count={totals.chat}
                    tint="sky"
                  />
                )}
                {totals.journal > 0 && (
                  <Chip
                    icon={BookOpen}
                    label="Journal"
                    count={totals.journal}
                    tint="emerald"
                  />
                )}
                {totals.assessment > 0 && (
                  <Chip
                    icon={ClipboardCheck}
                    label="Assessment"
                    count={totals.assessment}
                    tint="amber"
                  />
                )}
              </div>
            )}

            {/* Preview snippet */}
            {!isLoading && preview && (
              <div className="mx-4 mb-4 bg-muted/40 rounded-xl px-3 py-2.5 border border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">
                  {preview.label}
                </p>
                <div className="text-xs text-foreground/80 leading-relaxed line-clamp-2 [&_strong]:font-semibold [&_em]:italic">
                  <ReactMarkdown components={PREVIEW_COMPONENTS}>
                    {preview.text}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Empty state CTA when the user has zero data anywhere */}
            {!isLoading && !hasAnyData && (
              <div className="mx-4 mb-4 bg-muted/40 rounded-xl px-3 py-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Journal an entry, complete a journey day, or chat with Dr. Riya —
                  every moment lands here.
                </p>
              </div>
            )}

            {/* Footer CTA */}
            <div className="px-4 pb-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/70">
                  Explore your timeline
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-primary">
                  Open Growth
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  count,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  tint: 'violet' | 'sky' | 'emerald' | 'amber';
}) {
  const tintClass = {
    violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  }[tint];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold',
        tintClass,
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
      <span className="opacity-70">·</span>
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
