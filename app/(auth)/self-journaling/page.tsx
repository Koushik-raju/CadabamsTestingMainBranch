/**
 * FILE: app/(auth)/self-journaling/page.tsx
 *
 * PURPOSE:
 *   Home page for the Self Journaling feature. Sections:
 *   header → Free Flow hero → Continue Journey → Guided Reflection → date strip → entries.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches journaling categories via useJournalingCategories().
 *   2. Fetches all user entries via useSelfJournaling() (reads JournalEntry table).
 *   3. Fetches subscribed journals via useJournalingSubscriptions().
 *   4. Manages weekOffset state; builds 7-day WeekDay array with hasEntries flags.
 *   5. Passes the array to shared WeekDateStrip; below it renders DateEntriesCard
 *      filtered to the selected date. Both components are shared with the slug detail page.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   selectedDate        — local ISO date string for active day
 *   weekOffset          — how many days back the strip window starts
 *   publishedCategories — categories whose own status is PUBLISHED
 *
 * DEPENDENCIES:
 *   useSelfJournaling()           — hooks/self-journaling/use-self-journaling.ts
 *   useJournalingCategories()     — hooks/use-journaling.ts
 *   useJournalingSubscriptions()  — hooks/use-journaling-subscriptions.ts
 *   WeekDateStrip                 — components/journal/week-date-strip.tsx
 *   DateEntriesCard               — components/journal/date-entries-card.tsx
 *   buildWeekBaseDays, toLocalDateStr — lib/journal-utils.ts
 *
 * LAST UPDATED: 2026-05-07 — move Free Flow hero card into PageHeader subHeader to keep it sticky and remove overlap
 */
"use client";

import { Pencil } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { DisplayEntry } from "@/components/journal/date-entries-card";
import { DateEntriesCard } from "@/components/journal/date-entries-card";
import { JournalEntrySheet } from "@/components/journal/journal-entry-sheet";
import { WeekDateStrip } from "@/components/journal/week-date-strip";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { JournalEntryResponseDto } from "@/hooks/self-journaling/use-self-journaling";
import { useSelfJournaling } from "@/hooks/self-journaling/use-self-journaling";
import type { JournalingResponseDto } from "@/hooks/use-journaling";
import { extractString, useJournalingCategories } from "@/hooks/use-journaling";
import {
  type SubscriptionWithTitleResponseDto,
  useJournalingSubscriptions,
  useSubJournalDetail,
} from "@/hooks/use-journaling-subscriptions";
import { buildWeekBaseDays, toLocalDateStr } from "@/lib/journal-utils";
import { getJournalVisual } from "@/lib/journal-visual";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Subscribed Journey Card
// ---------------------------------------------------------------------------

function JourneyCard({
  subscription,
  onClick,
}: {
  subscription: SubscriptionWithTitleResponseDto;
  onClick: () => void;
}) {
  const { gradient, Icon } = getJournalVisual(subscription.title);
  const { sub, isLoading: detailLoading } = useSubJournalDetail(subscription.slug);

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 bg-card border border-border rounded-3xl overflow-hidden text-left shadow-[var(--sh-1)] hover:shadow-[var(--sh-2)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.97]"
    >
      {sub?.icon ? (
        <div className="h-20 relative overflow-hidden">
          <Image
            src={sub.icon}
            alt={subscription.title}
            fill
            className="object-cover"
            sizes="144px"
          />
        </div>
      ) : detailLoading ? (
        <Skeleton className="h-20 w-full rounded-none" />
      ) : (
        <div
          className={cn(
            "h-20 bg-gradient-to-br flex items-center justify-center relative overflow-hidden",
            gradient,
          )}
        >
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-5 -left-3 w-20 h-20 rounded-full bg-white/5" />
          <Icon className="w-8 h-8 text-white/90 relative z-10" />
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1">
          {subscription.title}
        </p>
        <p className="text-[10px] text-muted-foreground">Continue →</p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Category Card
// ---------------------------------------------------------------------------

function CategoryCard({
  category,
  onClick,
}: {
  category: JournalingResponseDto;
  onClick: () => void;
}) {
  const { gradient, Icon } = getJournalVisual(category.title);
  const subCount = category.subJournalings?.filter((s) => s.status === "PUBLISHED").length ?? 0;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 bg-card border border-border rounded-3xl overflow-hidden text-left shadow-[var(--sh-1)] hover:shadow-[var(--sh-2)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] group"
    >
      {extractString(category.icon) ? (
        <div className="h-20 relative overflow-hidden">
          <Image
            src={extractString(category.icon)}
            alt={category.title}
            fill
            className="object-cover"
            sizes="144px"
          />
        </div>
      ) : (
        <div
          className={cn(
            "h-20 bg-gradient-to-br flex items-center justify-center relative overflow-hidden",
            gradient,
          )}
        >
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-5 -left-3 w-20 h-20 rounded-full bg-white/5" />
          <Icon className="w-8 h-8 text-white/90 relative z-10" />
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1">
          {category.title}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {subCount} {subCount === 1 ? "journal" : "journals"}
        </p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {onViewAll && (
        <button onClick={onViewAll} className="text-xs text-primary font-medium hover:underline">
          View all
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Adapter: JournalEntryResponseDto → DisplayEntry
// ---------------------------------------------------------------------------

function toDisplayEntry(entry: JournalEntryResponseDto): DisplayEntry {
  const prompts = entry.prompts as Array<{ heading?: string; text?: string }> | undefined;
  const firstPrompt = prompts?.[0];
  return {
    id: entry.id,
    title: extractString(entry.title) || null,
    preview: (firstPrompt?.text ?? firstPrompt?.heading ?? extractString(entry.entryText)) || null,
    time: new Date(entry.createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    promptCount: prompts?.length ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JournalHomePage() {
  const router = useRouter();
  const { categories, subJournalings, isLoading: categoriesLoading } = useJournalingCategories();
  const { entries, isLoading: entriesLoading } = useSelfJournaling();
  const { subscriptions, isLoading: subscriptionsLoading } = useJournalingSubscriptions();

  const TODAY_STR = toLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetEntry, setSheetEntry] = useState<JournalEntryResponseDto | null>(null);

  /*
   * Show categories that have at least one PUBLISHED sub-journaling.
   * Parent CmsJournaling records may have status DRAFT even when children are PUBLISHED.
   */
  const publishedCategories = useMemo(
    () => categories.filter((c) => c.subJournalings?.some((s) => s.status === "PUBLISHED")),
    [categories],
  );

  /*
   * Build the 7-day strip. hasEntries is derived from journaledAt (local timezone)
   * so the dot appears on the same day the user sees on the strip.
   */
  const entryDateSet = useMemo(
    () => new Set(entries.map((e) => toLocalDateStr(new Date(e.journaledAt)))),
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
    () => entries.filter((e) => toLocalDateStr(new Date(e.journaledAt)) === selectedDate),
    [entries, selectedDate],
  );

  const displayEntries = useMemo(() => selectedEntries.map(toDisplayEntry), [selectedEntries]);

  /*
   * When an entry row is tapped, find the full JournalEntryResponseDto by id and
   * open the detail sheet. The sheet shows the journal name (resolved from
   * subJournalings fetched alongside categories) + full prompts/text.
   */
  const handleEntryClick = useCallback(
    (display: DisplayEntry) => {
      const full = selectedEntries.find((e) => e.id === display.id) ?? null;
      setSheetEntry(full);
    },
    [selectedEntries],
  );

  /*
   * subJournalingId is not yet in the SDK's JournalEntryResponseDto type — it
   * exists in the DB response but was omitted from the response DTO Swagger
   * decorator. Cast to unknown to access it until the DTO is updated + SDK regen.
   */
  const sheetSubId = sheetEntry
    ? extractString((sheetEntry as Record<string, unknown>).subJournalingId)
    : "";
  const sheetSub = sheetSubId ? subJournalings.find((s) => s.id === sheetSubId) : null;
  const sheetJournalName = sheetSub?.title ?? (sheetSubId ? "Journal Entry" : "Free Flow");
  const sheetJournalSlug = sheetSub?.slug ?? undefined;

  const sheetPrompts = sheetEntry
    ? (sheetEntry.prompts as Array<{ heading?: string; text?: string }> | undefined)
    : undefined;

  const selectedLabel =
    selectedDate === TODAY_STR
      ? "Today"
      : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <PageHeader
        title="Journal"
        subtitle="Your safe space for thoughts and feelings."
        hardBack="/home"
        subHeader={
          <div className="px-4 pt-1 pb-3">
            <button
              onClick={() => router.push("/self-journaling/new")}
              className="w-full bg-primary text-primary-foreground rounded-4xl overflow-hidden text-left shadow-[var(--sh-glow-orange)] hover:shadow-[var(--sh-3)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
            >
              <div className="p-5 flex items-center justify-between min-h-[100px] relative overflow-hidden">
                <div className="z-10">
                  <h3 className="text-lg font-bold mb-1">Free Flow</h3>
                  <p className="text-sm text-white/80 max-w-[200px] leading-tight">
                    Write whatever is on your mind. No prompts, just you.
                  </p>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-[var(--sh-2)]">
                  <Pencil className="w-5 h-5 text-primary" />
                </div>
                <Pencil
                  className="absolute right-[-20px] bottom-[-20px] text-white/5 rotate-12 pointer-events-none"
                  size={120}
                />
              </div>
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-6 mt-4">
        {/* ── Continue Journey ── */}
        {(subscriptionsLoading || subscriptions.length > 0) && (
          <section>
            <SectionHeader
              title="Continue Journey"
              onViewAll={
                subscriptions.length > 0
                  ? () => router.push("/self-journaling/subscriptions")
                  : undefined
              }
            />
            <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
              {subscriptionsLoading
                ? [...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="flex-shrink-0 w-36 h-36 rounded-2xl" />
                  ))
                : subscriptions.map((sub) => (
                    <JourneyCard
                      key={sub.id}
                      subscription={sub}
                      onClick={() => router.push(`/self-journaling/journal/${sub.slug}`)}
                    />
                  ))}
            </div>
          </section>
        )}

        {/* ── Guided Reflection ── */}
        <section>
          <SectionHeader
            title="Guided Reflection"
            onViewAll={() => router.push("/self-journaling/categories")}
          />
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
            {categoriesLoading
              ? [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="flex-shrink-0 w-36 h-36 rounded-2xl" />
                ))
              : publishedCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    onClick={() => router.push(`/self-journaling/categories/${cat.id}`)}
                  />
                ))}
          </div>
        </section>

        {/* ── Date strip + entries ── */}
        <section className="px-4 mb-5">
          <WeekDateStrip
            days={weekDays}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            weekLabel={weekLabel}
            canGoForward={weekOffset > 0}
            onPrevWeek={() => setWeekOffset((o) => o + 7)}
            onNextWeek={() => setWeekOffset((o) => Math.max(0, o - 7))}
          />
          <DateEntriesCard
            selectedLabel={selectedLabel}
            entries={displayEntries}
            isLoading={entriesLoading}
            isToday={selectedDate === TODAY_STR}
            onWriteNew={() => router.push("/self-journaling/new")}
            onEntryClick={handleEntryClick}
          />
        </section>
      </div>

      {/* ── Entry detail sheet ── */}
      <JournalEntrySheet
        open={!!sheetEntry}
        onClose={() => setSheetEntry(null)}
        journalName={sheetJournalName}
        journalIcon={null}
        title={sheetEntry ? extractString(sheetEntry.title) || null : null}
        prompts={sheetPrompts}
        plainText={sheetEntry ? extractString(sheetEntry.entryText) || null : null}
        dateLabel={selectedLabel}
        onJournal={() =>
          router.push(
            sheetJournalSlug
              ? `/self-journaling/new/${encodeURIComponent(sheetJournalSlug)}`
              : "/self-journaling/new",
          )
        }
      />
    </div>
  );
}
