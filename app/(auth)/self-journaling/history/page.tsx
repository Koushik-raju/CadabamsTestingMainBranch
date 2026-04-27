/**
 * FILE: app/(auth)/self-journaling/history/page.tsx
 *
 * PURPOSE:
 *   Full journal history page with search and optional category/sub-journal
 *   filtering. Shows all of the user's entries grouped by date.
 *
 * LOGIC OVERVIEW:
 *   1. Reads optional `categoryId` and `subJournalId` from URL search params.
 *   2. Fetches up to 300 entries via useSelfJournalingEntries(300).
 *   3. Filters entries by subJournalingId and/or free-text search query.
 *   4. Groups filtered entries by date bucket (Today / Yesterday / full date).
 *   5. Renders each date group as a single grouped Card with Separator rows.
 *   6. Tapping a row opens an EntryDetailModal bottom sheet.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   allEntries      — raw SWR list of JournalEntryResponseDto[]
 *   filteredEntries — entries after subJournal + search filters applied
 *   grouped         — GroupedEntries[] bucketed by date for display
 *   selectedEntry   — currently open entry in the detail modal, or null
 *
 * DEPENDENCIES:
 *   useSelfJournalingEntries() — SWR hook (hooks/use-journaling.ts)
 *   PageHeader                 — shared navigation header component
 *   Input                      — shadcn/ui text input
 *
 * LAST UPDATED: 2026-04-23 — Replaced custom header div with shared PageHeader; entry count passed via right slot.
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { extractString, useSelfJournalingEntries } from "@/hooks/use-journaling";
import type { JournalEntryResponseDto, JournalPromptDto } from "@/hooks/use-journaling";
import { cn } from "@/lib/utils";
import { BookOpen, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface GroupedEntries {
  label: string;
  dateStr: string;
  entries: JournalEntryResponseDto[];
}

function groupByDate(entries: JournalEntryResponseDto[]): GroupedEntries[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const map = new Map<string, JournalEntryResponseDto[]>();
  for (const entry of entries) {
    const d = new Date(entry.createdAt ?? "");
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

function matchesSearch(entry: JournalEntryResponseDto, query: string): boolean {
  const q = query.toLowerCase();
  if (extractString(entry.title).toLowerCase().includes(q)) return true;
  if (extractString(entry.entryText).toLowerCase().includes(q)) return true;
  /*
   * JournalEntryResponseDto.prompts is typed as Array<Array<unknown>> (Strapi
   * generator artifact). The runtime value is JournalPromptDto[] — cast here
   * so we can access heading/text safely.
   */
  const prompts = (entry.prompts ?? []) as unknown as JournalPromptDto[];
  if (
    prompts.some((p) => p.heading?.toLowerCase().includes(q) || p.text?.toLowerCase().includes(q))
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
  entry: JournalEntryResponseDto;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {extractString(entry.title) || "Journal Entry"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(entry.createdAt ?? "").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at{" "}
                {new Date(entry.createdAt ?? "").toLocaleTimeString("en-US", {
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
            (entry.prompts as unknown as JournalPromptDto[]).map((prompt, idx) => (
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
              {extractString(entry.entryText)}
            </p>
          )}

          {(entry.emotion || entry.stressLevel) && (
            <div className="flex gap-3 pt-2 border-t border-border">
              {entry.emotion && (
                <span className="text-xs text-muted-foreground">
                  {/* emotion/stressLevel are runtime numbers; SDK types them as objects (Strapi generator artifact) */}
                  Mood: {String(entry.emotion)}/5
                </span>
              )}
              {entry.stressLevel && (
                <span className="text-xs text-muted-foreground">
                  Stress: {String(entry.stressLevel)}/5
                </span>
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
  const subJournalId = searchParams.get("subJournalId");

  const { entries: allEntries, isLoading } = useSelfJournalingEntries(300);
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryResponseDto | null>(null);

  const filteredEntries = useMemo(() => {
    let filtered = allEntries;
    if (subJournalId) {
      filtered = filtered.filter((e) => extractString(e.subJournalingId) === subJournalId);
    }
    if (search.trim()) {
      filtered = filtered.filter((e) => matchesSearch(e, search));
    }
    return filtered;
  }, [allEntries, subJournalId, search]);

  const grouped = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <PageHeader
        title="Journal History"
        fallback="/self-journaling"
        hardBack="/self-journaling"
        right={
          <span className="text-xs text-muted-foreground">
            {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
          </span>
        }
      />

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 rounded-xl"
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
          <Card className="p-0">
            <CardContent className="py-0 px-3">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 py-3">
                    <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3 rounded" />
                      <Skeleton className="h-3 w-5/6 rounded" />
                    </div>
                    <Skeleton className="w-8 h-3 rounded" />
                  </div>
                  {i < 4 && <Separator />}
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
              <p className="font-semibold text-foreground">
                {search ? "No matching entries" : "No journal entries yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {search
                  ? "Try a different search term."
                  : "Start writing to build your reflection history."}
              </p>
            </div>
            {!search && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => router.push("/self-journaling/new")}
              >
                Write now
              </Button>
            )}
          </div>
        ) : (
          grouped.map((group) => (
            <section key={group.dateStr} className="mb-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                {group.label}
              </h3>
              <Card className="p-0">
                <CardContent className="py-0 px-3">
                  {group.entries.map((entry, i) => {
                    const time = new Date(entry.createdAt ?? "").toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const entryPrompts = (entry.prompts ?? []) as unknown as JournalPromptDto[];
                    const preview =
                      entryPrompts.length > 0
                        ? (entryPrompts[0].text ?? entryPrompts[0].heading ?? "")
                        : extractString(entry.entryText);
                    const promptCount = entryPrompts.length;

                    return (
                      <div key={entry.id}>
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="py-3 flex items-start gap-3 w-full text-left transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                          {/* Gradient icon tile */}
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
                            {extractString(entry.title) && (
                              <p className="text-sm font-medium text-foreground line-clamp-1 mb-0.5">
                                {extractString(entry.title)}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {preview}
                            </p>
                          </div>

                          <div className="flex-shrink-0 flex flex-col items-end gap-1">
                            <span className="text-xs text-muted-foreground">{time}</span>
                            {promptCount > 0 && (
                              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {promptCount}p
                              </span>
                            )}
                          </div>
                        </button>
                        {i < group.entries.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
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
