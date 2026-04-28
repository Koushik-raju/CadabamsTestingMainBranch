"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelfJournalingEntries } from "@/hooks/use-journaling";
import type { SelfJournalingEntry } from "@/hooks/use-journaling";
import { ChevronLeft, Clock, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface GroupedEntries {
  label: string;
  dateStr: string;
  entries: SelfJournalingEntry[];
}

function groupByDate(entries: SelfJournalingEntry[]): GroupedEntries[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const map = new Map<string, SelfJournalingEntry[]>();
  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    if (isNaN(d.getTime())) continue;
    const dateStr = d.toISOString().split("T")[0];
    const arr = map.get(dateStr) ?? [];
    arr.push(entry);
    map.set(dateStr, arr);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([dateStr, items]) => {
      let label: string;
      if (dateStr === todayStr) label = "Today";
      else if (dateStr === yesterdayStr) label = "Yesterday";
      else
        label = new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "short",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      return { label, dateStr, entries: items };
    });
}

function matchesSearch(entry: SelfJournalingEntry, query: string): boolean {
  const q = query.toLowerCase();
  if (entry.title?.toLowerCase().includes(q)) return true;
  if (entry.entry?.toLowerCase().includes(q)) return true;
  if (
    entry.prompts?.some(
      (p) => p.heading?.toLowerCase().includes(q) || p.text?.toLowerCase().includes(q),
    )
  )
    return true;
  return false;
}

// ---------------------------------------------------------------------------
// Entry Detail Modal
// ---------------------------------------------------------------------------

function EntryDetailModal({
  entry,
  onClose,
}: {
  entry: SelfJournalingEntry;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-background w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {entry.title ?? "Journal Entry"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(entry.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at{" "}
                {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 flex flex-col gap-5">
          {entry.prompts && entry.prompts.length > 0 ? (
            entry.prompts.map((prompt, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-4">
                {prompt.heading && (
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-[3px] h-6 bg-primary rounded-full flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-primary">{prompt.heading}</p>
                  </div>
                )}
                {prompt.text && (
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed ml-[11px]">
                    {prompt.text}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {entry.entry}
            </p>
          )}

          {(entry.emotion || entry.stressLevel) && (
            <div className="flex gap-3 pt-2 border-t border-border">
              {entry.emotion && (
                <span className="text-xs text-muted-foreground">Mood: {entry.emotion}/5</span>
              )}
              {entry.stressLevel && (
                <span className="text-xs text-muted-foreground">Stress: {entry.stressLevel}/5</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-8">
          <Button variant="outline" className="w-full rounded-full" onClick={onClose}>
            Close Entry
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History Content
// ---------------------------------------------------------------------------

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const subJournalId = searchParams.get("subJournalId");

  const { entries: allEntries, isLoading } = useSelfJournalingEntries(300);
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<SelfJournalingEntry | null>(null);

  const filteredEntries = useMemo(() => {
    let filtered = allEntries;

    // Filter by subJournalingId if provided
    if (subJournalId) {
      filtered = filtered.filter((e) => e.subJournalingId === subJournalId);
    }

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter((e) => matchesSearch(e, search));
    }

    return filtered;
  }, [allEntries, subJournalId, search]);

  const grouped = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">Journal History</h1>
          <p className="text-xs text-muted-foreground">
            {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 px-4 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20">
            <p className="text-muted-foreground">
              {search ? "No entries match your search." : "No journal entries yet."}
            </p>
            {!search && (
              <Button className="rounded-full" onClick={() => router.push("/self-journaling/new")}>
                Write now
              </Button>
            )}
          </div>
        ) : (
          grouped.map((group) => (
            <section key={group.dateStr}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                {group.label}
              </h3>
              <div className="flex flex-col gap-2">
                {group.entries.map((entry) => {
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
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 text-left relative overflow-hidden w-full"
                    >
                      <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {time}
                        </span>
                      </div>
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
                      {promptCount > 0 && (
                        <span className="flex-shrink-0 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {promptCount}
                        </span>
                      )}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}

export default function JournalHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
