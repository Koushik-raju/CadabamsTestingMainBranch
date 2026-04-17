/**
 * FILE: app/(auth)/self-journaling/categories/[id]/page.tsx
 *
 * PURPOSE:
 *   Detail page for a journaling category. Shows two tabs:
 *   "Journals" (all published sub-journalings to start) and
 *   "My Entries" (the user's past entries for this category, with the ability
 *   to redo any journal as many times as desired).
 *
 * LOGIC OVERVIEW:
 *   1. Reads the [id] route param to identify the category.
 *   2. Fetches all categories via useJournalingCategories() and finds the match.
 *   3. Fetches the user's entries via useSelfJournalingEntries().
 *   4. Filters entries to those whose subJournalingId belongs to this category's
 *      published sub-journalings.
 *   5. "Journals" tab — 2-column grid of sub-journaling cards; tapping opens a
 *      detail bottom sheet with a "Start Writing" CTA.
 *   6. "My Entries" tab — entries grouped by date in grouped Cards with Separator
 *      rows; each row has a "Write Again" button to re-enter the same sub-journal.
 *   7. Tapping a sub-journal or "Write Again" navigates to /self-journaling/new?slug=<slug>
 *      — the new page resolves all data (title, aiPrompt) by slug independently.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   categoryId       — string ID from route params
 *   category         — matched JournalingCategory object or undefined
 *   publishedSubs    — filtered list of PUBLISHED SubJournalingItem[]
 *   categoryEntries  — user's entries linked to any sub in this category
 *   selectedSub      — currently previewed sub-journaling for the bottom sheet
 *
 * DEPENDENCIES:
 *   useJournalingCategories()  — SWR hook (hooks/use-journaling.ts)
 *   useSelfJournalingEntries() — SWR hook (hooks/use-journaling.ts)
 *   BackButton                 — shared back navigation component
 *   Tabs, TabsList, TabsTrigger, TabsContent — shadcn/ui tabs
 *   getJournalVisual()         — lib/journal-visual.ts — unique gradient+icon per title
 *
 * LAST UPDATED: 2026-04-17 — Sub-journal card taps navigate to /self-journaling/journal/[slug]
 *   instead of opening a bottom sheet. Bottom sheet removed; detail page handles subscription.
 */
'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Pencil, BookOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/shared/navigation/back-button';
import { useJournalingCategories, useSelfJournalingEntries } from '@/hooks/use-journaling';
import type { SelfJournalingEntry } from '@/hooks/use-journaling';
import { cn } from '@/lib/utils';
import { getJournalVisual } from '@/lib/journal-visual';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface DateGroup {
  label: string;
  dateStr: string;
  entries: SelfJournalingEntry[];
}

function groupByDate(entries: SelfJournalingEntry[]): DateGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const map = new Map<string, SelfJournalingEntry[]>();
  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    if (isNaN(d.getTime())) continue;
    const dateStr = d.toISOString().split('T')[0];
    const arr = map.get(dateStr) ?? [];
    arr.push(entry);
    map.set(dateStr, arr);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([dateStr, items]) => {
      let label: string;
      if (dateStr === todayStr) label = 'Today';
      else if (dateStr === yesterdayStr) label = 'Yesterday';
      else label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
      });
      return { label, dateStr, entries: items };
    });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { categories, isLoading: catLoading } = useJournalingCategories();
  const { entries: allEntries, isLoading: entriesLoading } = useSelfJournalingEntries();

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const publishedSubs = useMemo(
    () => (category?.subJournalings ?? []).filter((s) => s.status === 'PUBLISHED'),
    [category],
  );

  // Entries that belong to any sub-journal in this category
  const categoryEntries = useMemo(
    () => allEntries.filter((e) => publishedSubs.some((s) => s.id === e.subJournalingId)),
    [allEntries, publishedSubs],
  );

  const grouped = useMemo(() => groupByDate(categoryEntries), [categoryEntries]);

  const isLoading = catLoading || entriesLoading;

  // ---- Loading state ----
  if (catLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <div className="flex items-center gap-2 px-4 pt-5 pb-3">
          <BackButton fallback="/self-journaling" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="px-4 mt-2">
          <Skeleton className="h-10 w-full rounded-full mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- Not found state ----
  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground">Category not found</p>
        <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/self-journaling" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{category.title}</h1>
          {category.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-4">
        <Tabs defaultValue="journals">
          <TabsList className="w-full rounded-full mb-4">
            <TabsTrigger value="journals" className="flex-1 rounded-full">
              Journals ({publishedSubs.length})
            </TabsTrigger>
            <TabsTrigger value="my-entries" className="flex-1 rounded-full">
              My Entries {categoryEntries.length > 0 ? `(${categoryEntries.length})` : ''}
            </TabsTrigger>
          </TabsList>

          {/* ---- Journals Tab ---- */}
          <TabsContent value="journals" className="mt-0">
            {publishedSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No journals yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    No guided journals are available in this category yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {publishedSubs.map((sub) => {
                  const { gradient, Icon: SubIcon } = getJournalVisual(sub.title);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => router.push(`/self-journaling/journal/${encodeURIComponent(sub.slug)}`)}
                      className="bg-card border border-border rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] group"
                    >
                      {/* Gradient image area */}
                      <div className={cn(
                        'aspect-[16/10] bg-gradient-to-br flex items-center justify-center relative overflow-hidden',
                        gradient,
                      )}>
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                        <div className="absolute -bottom-6 -left-3 w-24 h-24 rounded-full bg-white/5" />
                        {sub.icon ? (
                          <span className="text-3xl relative z-10">{sub.icon}</span>
                        ) : (
                          <SubIcon className="w-8 h-8 text-white/90 relative z-10" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                          {sub.title}
                        </h3>
                        {sub.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ---- My Entries Tab ---- */}
          <TabsContent value="my-entries" className="mt-0">
            {entriesLoading ? (
              <Card className="p-0">
                <CardContent className="py-0 px-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-3 py-3">
                        <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-2/3 rounded" />
                          <Skeleton className="h-3 w-5/6 rounded" />
                        </div>
                        <Skeleton className="w-16 h-7 rounded-xl" />
                      </div>
                      {i < 2 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No entries yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Complete a journal from this category to see your entries here.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    // Switch to journals tab
                    document.querySelector<HTMLButtonElement>('[value="journals"]')?.click();
                  }}
                >
                  Browse Journals
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {grouped.map((group) => (
                  <section key={group.dateStr}>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                      {group.label}
                    </h3>
                    <Card className="p-0">
                      <CardContent className="py-0 px-3">
                        {group.entries.map((entry, i) => {
                          const matchingSub = publishedSubs.find((s) => s.id === entry.subJournalingId);
                          const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          });
                          const preview =
                            entry.prompts && entry.prompts.length > 0
                              ? entry.prompts[0].text ?? entry.prompts[0].heading ?? ''
                              : entry.entry ?? '';

                          return (
                            <div key={entry.id}>
                              <div className="py-3 flex items-start gap-3">
                                {/* Gradient icon tile */}
                                <div className={cn(
                                  'relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600',
                                  'flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm',
                                )}>
                                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
                                  <BookOpen className="w-5 h-5 text-white" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground line-clamp-1 mb-0.5">
                                    {entry.title ?? matchingSub?.title ?? 'Journal Entry'}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                                    {preview}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{time}</p>
                                </div>

                                {/* Write Again button */}
                                {matchingSub && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-shrink-0 rounded-xl gap-1.5 text-xs"
                                    onClick={() => handleStartWriting(matchingSub)}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Again
                                  </Button>
                                )}
                              </div>
                              {i < group.entries.length - 1 && <Separator />}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </section>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
