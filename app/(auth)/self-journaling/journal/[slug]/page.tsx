/**
 * FILE: app/(auth)/self-journaling/journal/[slug]/page.tsx
 *
 * PURPOSE:
 *   Detail page for a single sub-journal. Two states:
 *   — Unsubscribed: metadata + Subscribe CTA
 *   — Subscribed: streak badge, navigable date strip, date-filtered entries + Write CTA
 *
 * LOGIC OVERVIEW:
 *   1. Reads [slug] from route params.
 *   2. Fetches sub-journal detail via useSubJournalDetail(slug).
 *   3. Fetches subscription list via useJournalingSubscriptions().
 *   4. When subscribed: fetches streak (currentStreak) via useJournalingStreak() and
 *      all entries via useSubJournalEntries().
 *   5. Subscribed view uses shared WeekDateStrip + DateEntriesCard (same as home page).
 *      hasEntries flags are computed from entry createdAt dates (local timezone).
 *   6. Subscribe/unsubscribe call the SDK and revalidate.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   slug       — route param
 *   sub        — SubJournalDetailResponseDto
 *   subscribed — boolean from isSubscribed(slug)
 *   streak     — StreakResponseDto (currentStreak only; weekDays replaced by client strip)
 *   entries    — SubJournalEntryDto[]
 *
 * DEPENDENCIES:
 *   useSubJournalDetail, useJournalingSubscriptions, useJournalingStreak,
 *     useSubJournalEntries, subscribeToJournal, unsubscribeFromJournal
 *       — hooks/use-journaling-subscriptions.ts
 *   WeekDateStrip   — components/journal/week-date-strip.tsx
 *   DateEntriesCard — components/journal/date-entries-card.tsx
 *   buildWeekBaseDays, toLocalDateStr — lib/journal-utils.ts
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { DateEntriesCard } from "@/components/journal/date-entries-card";
import type { DisplayEntry } from "@/components/journal/date-entries-card";
import { JournalEntrySheet } from "@/components/journal/journal-entry-sheet";
import { WeekDateStrip } from "@/components/journal/week-date-strip";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type SubJournalEntryDto,
  subscribeToJournal,
  unsubscribeFromJournal,
  useJournalingStreak,
  useJournalingSubscriptions,
  useSubJournalDetail,
  useSubJournalEntries,
} from "@/hooks/use-journaling-subscriptions";
import { buildWeekBaseDays, toLocalDateStr } from "@/lib/journal-utils";
import { getJournalVisual } from "@/lib/journal-visual";
import { cn } from "@/lib/utils";
import { BookOpen, CalendarDays, Clock, Flame, Pencil } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Adapter: SubJournalEntryDto → DisplayEntry
// ---------------------------------------------------------------------------

function toDisplayEntry(entry: SubJournalEntryDto): DisplayEntry {
  const firstPrompt = entry.prompts?.[0] ?? null;
  return {
    id: entry.id,
    title: entry.title ?? null,
    preview: firstPrompt?.text ?? firstPrompt?.heading ?? entry.entry ?? null,
    time: new Date(entry.createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JournalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const { sub, isLoading: subLoading } = useSubJournalDetail(slug);
  const { isSubscribed, isLoading: subListLoading } = useJournalingSubscriptions();
  const subscribed = isSubscribed(slug);

  const { streak, isLoading: streakLoading } = useJournalingStreak(slug, subscribed);
  const { entries, isLoading: entriesLoading } = useSubJournalEntries(slug, subscribed);

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [sheetEntry, setSheetEntry] = useState<SubJournalEntryDto | null>(null);

  const TODAY_STR = toLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [weekOffset, setWeekOffset] = useState(0);

  const isLoading = subLoading || subListLoading;
  const { gradient, Icon } = sub
    ? getJournalVisual(sub.title)
    : { gradient: "from-violet-500 to-purple-600", Icon: BookOpen };

  /*
   * Build date strip. SubJournalEntryDto has createdAt (not journaledAt); using
   * createdAt with local timezone is close enough since journaledAt ≈ createdAt.
   */
  const entryDateSet = useMemo(
    () => new Set(entries.map((e) => toLocalDateStr(new Date(e.createdAt)))),
    [entries],
  );

  const weekDays = useMemo(
    () =>
      buildWeekBaseDays(weekOffset).map((d) => ({ ...d, hasEntries: entryDateSet.has(d.dateStr) })),
    [weekOffset, entryDateSet],
  );

  const weekLabel =
    weekOffset === 0 ? "This week" : weekOffset === 7 ? "Last week" : `${weekOffset} days ago`;

  const selectedEntries = useMemo(
    () => entries.filter((e) => toLocalDateStr(new Date(e.createdAt)) === selectedDate),
    [entries, selectedDate],
  );

  const displayEntries = useMemo(() => selectedEntries.map(toDisplayEntry), [selectedEntries]);

  const selectedLabel =
    selectedDate === TODAY_STR
      ? "Today"
      : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

  const handleEntryClick = useCallback(
    (display: DisplayEntry) => {
      const full = selectedEntries.find((e) => e.id === display.id) ?? null;
      setSheetEntry(full);
    },
    [selectedEntries],
  );

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

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <PageHeader title="" hardBack="/self-journaling" />
        <div className="px-4 space-y-4 mt-2">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
        </div>
      </div>
    );
  }

  // ── Not found ──

  if (!sub) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <PageHeader title="Journal" hardBack="/self-journaling" />
        <div className="flex flex-col items-center justify-center flex-1 py-24 gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Journal not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              This journal may have been removed.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/self-journaling")}>
            Back to journals
          </Button>
        </div>
      </div>
    );
  }

  // ── Subscribed view ──

  if (subscribed) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-32">
        <PageHeader
          title={sub.title}
          hardBack="/self-journaling"
          right={
            !streakLoading && streak ? (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-bold">{streak.currentStreak} Day Streak</span>
              </div>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-5 px-4 mt-2">
          {/* Hero image */}
          {sub.icon ? (
            <div className="relative w-full h-36 rounded-3xl overflow-hidden shadow-[var(--sh-1)]">
              <Image src={sub.icon} alt={sub.title} fill className="object-cover" sizes="100vw" />
            </div>
          ) : (
            <div
              className={cn(
                "relative w-full h-36 rounded-3xl bg-gradient-to-br overflow-hidden shadow-[var(--sh-1)]",
                gradient,
              )}
            >
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-12 h-12 text-white/80" />
              </div>
            </div>
          )}

          {/* Badges */}
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

          {/* Shared date strip */}
          <WeekDateStrip
            days={weekDays}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            weekLabel={weekLabel}
            canGoForward={weekOffset > 0}
            onPrevWeek={() => setWeekOffset((o) => o + 7)}
            onNextWeek={() => setWeekOffset((o) => Math.max(0, o - 7))}
          />

          {/* Shared entries card */}
          <section className="mb-5">
            <DateEntriesCard
              selectedLabel={selectedLabel}
              entries={displayEntries}
              isLoading={entriesLoading}
              isToday={selectedDate === TODAY_STR}
              onWriteNew={() => router.push(`/self-journaling/new/${encodeURIComponent(slug)}`)}
              onEntryClick={handleEntryClick}
            />
          </section>
        </div>

        {/* Entry detail sheet */}
        <JournalEntrySheet
          open={!!sheetEntry}
          onClose={() => setSheetEntry(null)}
          journalName={sub.title}
          journalIcon={sub.icon ?? null}
          title={sheetEntry?.title ?? null}
          prompts={sheetEntry?.prompts ?? undefined}
          plainText={sheetEntry?.entry ?? null}
          dateLabel={selectedLabel}
          onJournal={() => router.push(`/self-journaling/new/${encodeURIComponent(slug)}`)}
        />

        {/* Fixed CTA */}
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

  // ── Unsubscribed view ──

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      <PageHeader title={sub.title} hardBack="/self-journaling" />

      <div className="flex flex-col gap-5 px-4 mt-2">
        {/* Hero image */}
        {sub.icon ? (
          <div className="relative w-full h-48 rounded-3xl overflow-hidden shadow-[var(--sh-1)]">
            <Image src={sub.icon} alt={sub.title} fill className="object-cover" sizes="100vw" />
          </div>
        ) : (
          <div
            className={cn(
              "relative w-full h-48 rounded-3xl bg-gradient-to-br overflow-hidden shadow-[var(--sh-1)]",
              gradient,
            )}
          >
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-16 h-16 text-white/80" />
            </div>
          </div>
        )}

        {/* Badges */}
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

        <div>
          <h2 className="text-xl font-bold text-foreground leading-snug mb-3">{sub.title}</h2>
          {sub.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {sub.description}
            </p>
          )}
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-10 pt-3 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <p className="text-center text-xs text-muted-foreground mb-3">
          Subscribe to track your streak and start writing
        </p>
        <Button
          className="w-full rounded-full h-14 text-base font-semibold gap-2 shadow-[var(--sh-glow-orange)] active:scale-[0.98] transition-transform"
          onClick={handleSubscribe}
          disabled={isSubscribing}
        >
          {isSubscribing ? (
            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <BookOpen className="w-4 h-4" />
          )}
          {isSubscribing ? "Subscribing…" : "Subscribe to Journal"}
        </Button>
      </div>
    </div>
  );
}
