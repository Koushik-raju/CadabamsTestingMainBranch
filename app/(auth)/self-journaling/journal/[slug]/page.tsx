/**
 * FILE: app/(auth)/self-journaling/journal/[slug]/page.tsx
 *
 * PURPOSE:
 *   Detail page for a single sub-journal (journal). Shows one of two states:
 *   — Unsubscribed: journal metadata (title, description, cadence) + "Subscribe" CTA
 *   — Subscribed: streak, 7-day activity calendar, recent entries + "Write Today's Entry" CTA
 *
 * LOGIC OVERVIEW:
 *   1. Reads [slug] from route params.
 *   2. Fetches sub-journal detail via useSubJournalDetail(slug).
 *   3. Fetches subscription list via useJournalingSubscriptions() to determine
 *      isSubscribed without an extra endpoint call.
 *   4. When subscribed: also fetches streak via useJournalingStreak() and
 *      recent entries via useSubJournalEntries().
 *   5. Subscribe / unsubscribe mutations call the SDK and revalidate the list.
 *   6. "Write Today's Entry" navigates to /self-journaling/new/[slug].
 *   7. description is rendered as a plain string (API returns string, SDK types it broader).
 *      Internal fields (aiPrompt) are never displayed.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   slug        — route param; identifies the sub-journal
 *   sub         — SubJournalDetailResponseDto from useSubJournalDetail
 *   subscribed  — boolean from useJournalingSubscriptions().isSubscribed(slug)
 *   streak      — StreakResponseDto (currentStreak, weekDays) — subscribed only
 *   entries     — SubJournalEntryDto[] for recent entries section — subscribed only
 *
 * DEPENDENCIES:
 *   useSubJournalDetail()         — hooks/use-journaling-subscriptions.ts
 *   useJournalingSubscriptions()  — hooks/use-journaling-subscriptions.ts
 *   useJournalingStreak()         — hooks/use-journaling-subscriptions.ts
 *   useSubJournalEntries()        — hooks/use-journaling-subscriptions.ts
 *   subscribeToJournal()          — hooks/use-journaling-subscriptions.ts
 *   unsubscribeFromJournal()      — hooks/use-journaling-subscriptions.ts
 *   getJournalVisual()            — lib/journal-visual.ts
 *   BackButton                    — components/shared/navigation/back-button.tsx
 *
 * LAST UPDATED: 2026-04-22 — SDK types fixed; removed typeof guards; hero tile now
 *   renders sub.icon as cover image (next/image) with gradient fallback.
 */
'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Flame,
  Pencil,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/shared/navigation/back-button';
import {
  useSubJournalDetail,
  useJournalingSubscriptions,
  useJournalingStreak,
  useSubJournalEntries,
  subscribeToJournal,
  unsubscribeFromJournal,
  type SubJournalEntryDto,
} from '@/hooks/use-journaling-subscriptions';
import { cn } from '@/lib/utils';
import { getJournalVisual } from '@/lib/journal-visual';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatEntryTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatEntryDate(iso: string): string {
  const d = new Date(iso);
  const todayStr = toLocalDateStr(new Date());
  const dateStr = toLocalDateStr(d);
  if (dateStr === todayStr) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === toLocalDateStr(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Entry row inside a grouped card
// ---------------------------------------------------------------------------

function EntryRow({ entry }: { entry: SubJournalEntryDto }) {
  const firstPrompt = entry.prompts?.[0] ?? null;
  const preview = firstPrompt?.text ?? entry.entry ?? null;
  const title = entry.title ?? null;

  return (
    <div className="py-3 flex items-start gap-3">
      <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-foreground line-clamp-1 mb-0.5">{title}</p>
        )}
        {preview && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{preview}</p>
        )}
      </div>
      <span className="flex-shrink-0 text-xs text-muted-foreground">
        {formatEntryTime(entry.createdAt)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JournalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const { sub, isLoading: subLoading } = useSubJournalDetail(slug);
  const { isSubscribed, isLoading: subListLoading } = useJournalingSubscriptions();
  const subscribed = isSubscribed(slug);

  const { streak, isLoading: streakLoading } = useJournalingStreak(slug, subscribed);
  const { entries, isLoading: entriesLoading } = useSubJournalEntries(slug, subscribed);

  const [isSubscribing, setIsSubscribing] = useState(false);

  const isLoading = subLoading || subListLoading;

  const { gradient, Icon } = sub ? getJournalVisual(sub.title) : { gradient: 'from-violet-500 to-purple-600', Icon: BookOpen };

  // Group entries by date for display (max 3 groups)
  const entryGroups = (() => {
    const map = new Map<string, SubJournalEntryDto[]>();
    for (const e of entries) {
      const label = formatEntryDate(e.createdAt);
      const arr = map.get(label) ?? [];
      arr.push(e);
      map.set(label, arr);
    }
    return Array.from(map.entries()).slice(0, 3);
  })();

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      await subscribeToJournal(slug);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubscribing(true);
    try {
      await unsubscribeFromJournal(slug);
    } finally {
      setIsSubscribing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <div className="flex items-center gap-2 px-4 pt-5 pb-3">
          <BackButton fallback="/self-journaling" />
          <Skeleton className="h-6 w-40 flex-1" />
        </div>
        <div className="px-4 space-y-4 mt-2">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------

  if (!sub) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <div className="flex items-center gap-2 px-4 pt-5 pb-3">
          <BackButton fallback="/self-journaling" />
          <h1 className="flex-1 text-lg font-bold text-foreground">Journal</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 py-24 gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Journal not found</p>
            <p className="text-sm text-muted-foreground mt-1">This journal may have been removed.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/self-journaling')}>
            Back to journals
          </Button>
        </div>
      </div>
    );
  }

  const descriptionText = sub.description;

  // ---------------------------------------------------------------------------
  // Subscribed view
  // ---------------------------------------------------------------------------

  if (subscribed) {
    const today = toLocalDateStr(new Date());

    return (
      <div className="flex flex-col min-h-screen bg-background pb-32">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-5 pb-3">
          <BackButton fallback="/self-journaling" />
          <h1 className="flex-1 text-lg font-bold text-foreground">{sub.title}</h1>
          {streak && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{streak.currentStreak} Day Streak</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 px-4 mt-2">

          {/* Hero image */}
          {sub.icon ? (
            <div className="relative w-full h-36 rounded-2xl overflow-hidden shadow-sm">
              <Image src={sub.icon} alt={sub.title} fill className="object-cover" sizes="100vw" />
            </div>
          ) : (
            <div className={cn(
              'relative w-full h-36 rounded-2xl bg-gradient-to-br overflow-hidden shadow-sm',
              gradient,
            )}>
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-12 h-12 text-white/80" />
              </div>
            </div>
          )}

          {/* Cadence + tags */}
          <div className="flex flex-wrap gap-2">
            {sub.recommendedCadence && (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{sub.recommendedCadence}</span>
              </div>
            )}
            {sub.estimatedMinutes != null && sub.estimatedMinutes > 0 && (
              <div className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-3 py-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">~{sub.estimatedMinutes} min</span>
              </div>
            )}
            {sub.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Week calendar */}
          {streakLoading ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : streak ? (
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  {streak.weekDays.map((day, i) => {
                    const isToday = day.date === today;
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-1.5">
                        <span className={cn(
                          'text-[11px] font-medium',
                          isToday ? 'text-primary' : 'text-muted-foreground',
                        )}>
                          {DAY_LETTERS[i]}
                        </span>
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                          isToday ? 'bg-primary text-primary-foreground' :
                          day.hasEntry ? 'bg-primary/15 text-primary' :
                          'text-foreground',
                        )}>
                          {new Date(day.date + 'T00:00:00').getDate()}
                        </div>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          day.hasEntry ? 'bg-primary' : 'bg-transparent',
                        )} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Recent Entries */}
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground">Recent Entries</h2>
              {entries.length > 0 && (
                <span className="text-xs text-muted-foreground">{entries.length} total</span>
              )}
            </div>

            {entriesLoading ? (
              <Card>
                <CardContent className="py-0 px-3">
                  {[0, 1].map((i) => (
                    <div key={i}>
                      <div className="flex items-center gap-3 py-3">
                        <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-2/3 rounded" />
                          <Skeleton className="h-3 w-5/6 rounded" />
                        </div>
                        <Skeleton className="w-10 h-3 rounded" />
                      </div>
                      {i < 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No entries yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your first reflection to start your streak!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {entryGroups.map(([dateLabel, groupEntries]) => (
                  <div key={dateLabel} className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{dateLabel}</p>
                    <Card className="p-0">
                      <CardContent className="py-0 px-3">
                        {groupEntries.map((entry, i) => (
                          <div key={entry.id}>
                            <EntryRow entry={entry} />
                            {i < groupEntries.length - 1 && <Separator />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </>
            )}
          </section>

        </div>

        {/* Fixed bottom */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-10 pt-3 bg-background/95 backdrop-blur-sm">
          <Button
            className="w-full rounded-full h-14 text-base font-semibold gap-2"
            onClick={() => router.push(`/self-journaling/new/${encodeURIComponent(slug)}`)}
          >
            <Pencil className="w-4 h-4" />
            Write Today&apos;s Entry
          </Button>
        </div>

      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Unsubscribed view
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/self-journaling" />
        <h1 className="flex-1 text-lg font-bold text-foreground">{sub.title}</h1>
      </div>

      <div className="flex flex-col gap-5 px-4 mt-2">

        {/* Hero image */}
        {sub.icon ? (
          <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-sm">
            <Image src={sub.icon} alt={sub.title} fill className="object-cover" sizes="100vw" />
          </div>
        ) : (
          <div className={cn(
            'relative w-full h-48 rounded-2xl bg-gradient-to-br overflow-hidden shadow-sm',
            gradient,
          )}>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-16 h-16 text-white/80" />
            </div>
          </div>
        )}

        {/* Cadence + time badges */}
        <div className="flex flex-wrap gap-2">
          {sub.recommendedCadence && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1">
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{sub.recommendedCadence}</span>
            </div>
          )}
          {sub.estimatedMinutes != null && sub.estimatedMinutes > 0 && (
            <div className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-3 py-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">~{sub.estimatedMinutes} min</span>
            </div>
          )}
          {sub.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title + description */}
        <div>
          <h2 className="text-xl font-bold text-foreground leading-snug mb-3">{sub.title}</h2>
          {descriptionText && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {descriptionText}
            </p>
          )}
        </div>

      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-10 pt-3 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <p className="text-center text-xs text-muted-foreground mb-3">
          Subscribe to track your streak and start writing
        </p>
        <Button
          className="w-full rounded-full h-14 text-base font-semibold gap-2 shadow-lg active:scale-[0.98] transition-transform"
          onClick={handleSubscribe}
          disabled={isSubscribing}
        >
          {isSubscribing ? (
            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <BookOpen className="w-4 h-4" />
          )}
          {isSubscribing ? 'Subscribing…' : 'Subscribe to Journal'}
        </Button>
      </div>

    </div>
  );
}
