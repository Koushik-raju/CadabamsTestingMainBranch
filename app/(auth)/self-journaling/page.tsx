/**
 * FILE: app/(auth)/self-journaling/page.tsx
 *
 * PURPOSE:
 *   Home page for the Self Journaling feature. Sections:
 *   header → Free Flow hero → Continue Journey (subscribed journals) →
 *   Guided Reflection horizontal scroll → date-strip picker → entries.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches published journaling categories via useJournalingCategories().
 *   2. Fetches the user's journal entries via useSelfJournalingEntries().
 *   3. Fetches the user's subscribed journals via useJournalingSubscriptions().
 *   4. Builds a 7-day date strip (today + 6 prior days) with week-offset navigation.
 *   5. selectedDate state drives which day's entries are shown below the strip.
 *   6. A dot appears on strip days that have at least one entry.
 *   7. "Continue Journey" section shows subscribed journals in a horizontal scroll;
 *      "View all" navigates to /self-journaling/subscriptions.
 *   8. "Guided Reflection" shows published categories in a horizontal scroll;
 *      "View all" navigates to /self-journaling/categories.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   selectedDate        — ISO date string for the active date strip day
 *   selectedEntries     — entries filtered to selectedDate
 *   entryDateSet        — Set of ISO date strings that have at least one entry
 *   publishedCategories — PUBLISHED JournalingCategory[]
 *   subscriptions       — SubscriptionWithTitleResponseDto[] (user's subscribed journals)
 *
 * DEPENDENCIES:
 *   useJournalingCategories()       — SWR hook (hooks/use-journaling.ts)
 *   useSelfJournalingEntries()      — SWR hook (hooks/use-journaling.ts)
 *   useJournalingSubscriptions()    — SWR hook (hooks/use-journaling-subscriptions.ts)
 *   PageHeader                      — shared navigation header
 *   getJournalVisual()              — lib/journal-visual.ts
 *
 * LAST UPDATED: 2026-04-23 — JourneyCard now fetches sub-journal detail to show
 *   cover image; gradient tile is fallback only (same pattern as subscriptions page).
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useJournalingCategories, useSelfJournalingEntries } from "@/hooks/use-journaling";
import type { JournalingCategory, SelfJournalingEntry } from "@/hooks/use-journaling";
import {
  type SubscriptionWithTitleResponseDto,
  useJournalingSubscriptions,
  useSubJournalDetail,
} from "@/hooks/use-journaling-subscriptions";
import { getJournalVisual } from "@/lib/journal-visual";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Timezone-safe local date string: "2026-04-17" */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildWeekDays(offsetDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offsetDays - (6 - i));
    return {
      dateStr: toLocalDateStr(d),
      dayLetter: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      dayNum: d.getDate(),
      monthShort: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });
}

// ---------------------------------------------------------------------------
// Subscribed Journey Card — horizontal scroll variant
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
      className="flex-shrink-0 w-36 bg-card border border-border rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-[0.97]"
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
// Category Card — horizontal scroll variant (fixed width)
// ---------------------------------------------------------------------------

function CategoryCard({
  category,
  onClick,
}: {
  category: JournalingCategory;
  onClick: () => void;
}) {
  const { gradient, Icon } = getJournalVisual(category.title);
  const subCount = category.subJournalings?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 bg-card border border-border rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] active:scale-[0.97] group"
    >
      {category.icon ? (
        <div className="h-20 relative overflow-hidden">
          <Image
            src={category.icon}
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
// Entry Row — rendered inside a grouped Card
// ---------------------------------------------------------------------------

function EntryRow({ entry }: { entry: SelfJournalingEntry }) {
  const time = new Date(entry.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const preview =
    entry.prompts && entry.prompts.length > 0
      ? (entry.prompts[0].text ?? entry.prompts[0].heading ?? "")
      : (entry.entry ?? "");

  const promptCount = entry.prompts?.length ?? 0;

  return (
    <div className="py-3 flex items-start gap-3 transition-colors hover:bg-muted/50 active:bg-muted cursor-pointer">
      <div
        className={cn(
          "relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600",
          "flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm",
        )}
      >
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
        <BookOpen className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {entry.title && (
          <p className="text-sm font-medium text-foreground line-clamp-1 mb-0.5">{entry.title}</p>
        )}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{preview}</p>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground">{time}</span>
        {promptCount > 0 && (
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
            {promptCount}p
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section header with optional "View all" link
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
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
// Page
// ---------------------------------------------------------------------------

export default function JournalHomePage() {
  const router = useRouter();
  const { categories, isLoading: categoriesLoading } = useJournalingCategories();
  const { entries, isLoading: entriesLoading } = useSelfJournalingEntries();
  const { subscriptions, isLoading: subscriptionsLoading } = useJournalingSubscriptions();

  const TODAY_STR = toLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => buildWeekDays(weekOffset), [weekOffset]);

  const publishedCategories = useMemo(
    () => categories.filter((c) => c.status === "PUBLISHED"),
    [categories],
  );

  const entryDateSet = useMemo(
    () => new Set(entries.map((e) => toLocalDateStr(new Date(e.createdAt)))),
    [entries],
  );

  const selectedEntries = useMemo(
    () => entries.filter((e) => toLocalDateStr(new Date(e.createdAt)) === selectedDate),
    [entries, selectedDate],
  );

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
      {/* ── Header ── */}
      <PageHeader
        title="Journal"
        subtitle="Your safe space for thoughts and feelings."
        hardBack="/home"
      />

      <div className="flex flex-col gap-6 mt-4">
        {/* ── Free Flow hero ── */}
        <div className="px-4">
          <button
            onClick={() => router.push("/self-journaling/new")}
            className="w-full bg-primary text-primary-foreground rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className="p-5 flex items-center justify-between min-h-[100px] relative overflow-hidden">
              <div className="z-10">
                <h3 className="text-lg font-bold mb-1">Free Flow</h3>
                <p className="text-sm text-white/80 max-w-[200px] leading-tight">
                  Write whatever is on your mind. No prompts, just you.
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-md">
                <Pencil className="w-5 h-5 text-primary" />
              </div>
              <Pencil
                className="absolute right-[-20px] bottom-[-20px] text-white/5 rotate-12 pointer-events-none"
                size={120}
              />
            </div>
          </button>
        </div>

        {/* ── Continue Journey (subscribed journals) ── */}
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

        {/* ── Guided Reflection horizontal scroll ── */}
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
          {/* Week navigation row */}
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => setWeekOffset((o) => o + 7)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {weekOffset === 0
                ? "This week"
                : weekOffset === 7
                  ? "Last week"
                  : `${weekOffset} days ago`}
            </span>
            <button
              onClick={() => setWeekOffset((o) => Math.max(0, o - 7))}
              className={cn(
                "p-1 rounded-lg transition-colors",
                weekOffset === 0 ? "opacity-30 pointer-events-none" : "hover:bg-muted",
              )}
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Day strip */}
          <div className="flex items-center justify-between gap-1 mb-4">
            {weekDays.map(({ dateStr, dayLetter, dayNum }) => {
              const isSelected = dateStr === selectedDate;
              const hasEntries = entryDateSet.has(dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className="flex-1 flex flex-col items-center gap-1 py-1 transition-colors"
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isSelected ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {dayLetter}
                  </span>
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {dayNum}
                  </span>
                  <span
                    className={cn(
                      "w-1 h-1 rounded-full transition-opacity",
                      hasEntries ? "bg-primary opacity-100" : "opacity-0",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Entries for selected date */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">{selectedLabel}</h2>
            {selectedEntries.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedEntries.length} {selectedEntries.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>

          {entriesLoading ? (
            <Card className="p-0">
              <CardContent className="py-0 px-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 py-3">
                      <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-2/3 rounded" />
                        <Skeleton className="h-3 w-5/6 rounded" />
                      </div>
                      <Skeleton className="w-8 h-3 rounded" />
                    </div>
                    {i < 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : selectedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedDate === TODAY_STR ? "No entry today yet" : "Nothing written this day"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDate === TODAY_STR
                    ? "Take a moment to reflect — it only takes a minute."
                    : "No journal entries for this date."}
                </p>
              </div>
              {selectedDate === TODAY_STR && (
                <Button
                  className="rounded-xl px-6 gap-2"
                  onClick={() => router.push("/self-journaling/new")}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Start Journaling
                </Button>
              )}
            </div>
          ) : (
            <Card className="p-0">
              <CardContent className="py-0 px-3">
                {selectedEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    onClick={() => router.push(`/self-journaling/${selectedDate}`)}
                  >
                    <EntryRow entry={entry} />
                    {i < selectedEntries.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
