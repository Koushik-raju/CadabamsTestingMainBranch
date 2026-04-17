'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Pencil, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useJournalingCategories,
  useSelfJournalingEntries,
} from '@/hooks/use-journaling';
import type { SelfJournalingEntry, JournalingCategory } from '@/hooks/use-journaling';

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

  return groups.slice(0, 3); // Show up to 3 date groups
}

// ---------------------------------------------------------------------------
// Category Card
// ---------------------------------------------------------------------------

function CategoryCard({ category, onClick }: { category: JournalingCategory; onClick: () => void }) {
  const subCount = category.subJournalings?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
    >
      {/* Image area */}
      <div className="aspect-[16/10] bg-primary/10 flex items-center justify-center relative overflow-hidden">
        {category.icon ? (
          <span className="text-4xl">{category.icon}</span>
        ) : (
          <div className="flex items-end gap-1 h-8">
            {[0.6, 1, 0.4, 0.8].map((h, i) => (
              <div
                key={i}
                className="w-2 bg-primary/40 rounded-full animate-pulse"
                style={{ height: `${h * 100}%`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1">
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
// Entry Row
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
    <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer relative overflow-hidden">
      {/* Time badge */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">{time}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {entry.title && (
          <p className="text-sm font-semibold text-foreground line-clamp-1 mb-0.5">
            {entry.title}
          </p>
        )}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {preview}
        </p>
      </div>

      {/* Prompt count */}
      {promptCount > 0 && (
        <span className="flex-shrink-0 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
          {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
        </span>
      )}

      {/* Right accent gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
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
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Self Journaling</h1>
          <p className="text-sm text-muted-foreground">Reflect, write, and grow</p>
        </div>
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
              className="bg-primary text-primary-foreground rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group col-span-2"
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
                  <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
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
        <section>
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
                View Full History
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {entriesLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : recentGroups.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">
                No entries yet. Start your first journal!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {recentGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-2">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => {
                          const dateStr = new Date(entry.createdAt).toISOString().split('T')[0];
                          router.push(`/self-journaling/${dateStr}`);
                        }}
                      >
                        <EntryRow entry={entry} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
