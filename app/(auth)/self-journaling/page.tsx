/**
 * FILE: app/(auth)/self-journaling/page.tsx
 *
 * PURPOSE:
 *   Home page for the Self Journaling feature. Shows a quick-start free writing
 *   button, a grid of published journaling categories, and recent reflections
 *   grouped by date.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches published journaling categories via useJournalingCategories().
 *   2. Fetches the user's entries via useSelfJournalingEntries().
 *   3. Filters categories by PUBLISHED status.
 *   4. Groups the last 3 date buckets of entries for the "Recent Reflections" section.
 *   5. Navigates to /self-journaling/new for free writing or to
 *      /self-journaling/categories/[id] for guided category journaling.
 *   6. Tapping an entry row navigates to /self-journaling/[date] for the day view.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   publishedCategories  — filtered list of PUBLISHED JournalingCategory items
 *   recentGroups         — up to 3 date-bucketed groups of SelfJournalingEntry[]
 *   CategoryCard         — card component for a journaling category tile
 *   EntryRow             — grouped-list row for a single journal entry
 *
 * DEPENDENCIES:
 *   useJournalingCategories()  — SWR hook for CMS journaling categories
 *   useSelfJournalingEntries() — SWR hook for the user's own entries
 *   BackButton                 — shared back navigation component
 *   getJournalVisual()         — lib/journal-visual.ts, unique gradient+icon per title
 *
 * LAST UPDATED: 2026-04-17 — Unique gradient+icon tiles per category title via
 *   getJournalVisual(); design compliance fixes.
 */
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/shared/navigation/back-button';
import {
  useJournalingCategories,
  useSelfJournalingEntries,
} from '@/hooks/use-journaling';
import type { SelfJournalingEntry, JournalingCategory } from '@/hooks/use-journaling';
import { cn } from '@/lib/utils';
import { getJournalVisual } from '@/lib/journal-visual';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupEntriesByDate(entries: SelfJournalingEntry[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const groups: { label: string; entries: SelfJournalingEntry[] }[] = [];
  const map = new Map<string, SelfJournalingEntry[]>();

  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    if (isNaN(d.getTime())) continue;
    const dateStr = d.toISOString().split('T')[0];
    const arr = map.get(dateStr) ?? [];
    arr.push(entry);
    map.set(dateStr, arr);
  }

  for (const [dateStr, items] of Array.from(map.entries()).sort(([a], [b]) => (a > b ? -1 : 1))) {
    let label: string;
    if (dateStr === todayStr) label = 'Today';
    else if (dateStr === yesterdayStr) label = 'Yesterday';
    else label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    groups.push({ label, entries: items });
  }

  return groups.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Category Card
// ---------------------------------------------------------------------------

function CategoryCard({ category, onClick }: { category: JournalingCategory; onClick: () => void }) {
  const subCount = category.subJournalings?.length ?? 0;
  const { gradient, Icon } = getJournalVisual(category.title);

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] group"
    >
      {/* Gradient image area */}
      <div className={cn(
        'aspect-[16/10] bg-gradient-to-br flex items-center justify-center relative overflow-hidden',
        gradient,
      )}>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full bg-white/5" />
        {category.icon ? (
          <span className="text-4xl relative z-10">{category.icon}</span>
        ) : (
          <Icon className="w-10 h-10 text-white/90 relative z-10" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
          {category.title}
        </h3>
        {category.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {category.description}
          </p>
        )}
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
          {subCount} {subCount === 1 ? 'journal' : 'journals'}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Entry Row — rendered inside a grouped Card, not as a standalone card
// ---------------------------------------------------------------------------

function EntryRow({ entry }: { entry: SelfJournalingEntry }) {
  const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const preview =
    entry.prompts && entry.prompts.length > 0
      ? entry.prompts[0].text ?? entry.prompts[0].heading ?? ''
      : entry.entry ?? '';

  const promptCount = entry.prompts?.length ?? 0;

  return (
    <div className="py-3 flex items-start gap-3 transition-colors hover:bg-muted/50 active:bg-muted cursor-pointer">
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
        {entry.title && (
          <p className="text-sm font-medium text-foreground line-clamp-1 mb-0.5">
            {entry.title}
          </p>
        )}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {preview}
        </p>
      </div>

      {/* Right meta */}
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
// Page
// ---------------------------------------------------------------------------

export default function JournalHomePage() {
  const router = useRouter();
  const { categories, isLoading: categoriesLoading } = useJournalingCategories();
  const { entries, isLoading: entriesLoading } = useSelfJournalingEntries();

  const publishedCategories = useMemo(
    () => categories.filter((c) => c.status === 'PUBLISHED'),
    [categories],
  );

  const recentGroups = useMemo(() => groupEntriesByDate(entries), [entries]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/home" />
        <h1 className="flex-1 text-lg font-bold text-foreground">Self Journaling</h1>
      </div>

      <div className="px-4 flex flex-col gap-6">
        {/* Start Journaling Section */}
        <section>
          <h2 className="text-base font-bold text-foreground mb-3">
            Start Journaling
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Free Writing Card */}
            <button
              onClick={() => router.push('/self-journaling/new')}
              className="bg-primary text-primary-foreground rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] group col-span-2"
            >
              <div className="p-5 flex items-center justify-between min-h-[100px] relative overflow-hidden">
                <div className="z-10">
                  <h3 className="text-lg font-bold mb-1">Free Writing</h3>
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

            {/* Category cards */}
            {categoriesLoading
              ? [...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
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

        {/* Recent Reflections */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">
              Your Recent Reflections
            </h2>
            {entries.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary text-xs gap-1"
                onClick={() => router.push('/self-journaling/history')}
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

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
                      <Skeleton className="w-8 h-3 rounded" />
                    </div>
                    {i < 2 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : recentGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No entries yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Start your first journal to see your reflections here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {recentGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    {group.label}
                  </p>
                  <Card className="p-0">
                    <CardContent className="py-0 px-3">
                      {group.entries.map((entry, i) => (
                        <div
                          key={entry.id}
                          onClick={() => {
                            const dateStr = new Date(entry.createdAt).toISOString().split('T')[0];
                            router.push(`/self-journaling/${dateStr}`);
                          }}
                        >
                          <EntryRow entry={entry} />
                          {i < group.entries.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
