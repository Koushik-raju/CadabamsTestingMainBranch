/**
 * FILE: components/journal/date-entries-card.tsx
 *
 * PURPOSE:
 *   Reusable entries display for a selected date. Used on both the home journal
 *   page and the sub-journal detail page below the shared date strip.
 *
 * LOGIC OVERVIEW:
 *   Accepts a normalized array of DisplayEntry objects so callers are decoupled
 *   from the underlying SDK type. Renders a header (label + count), loading
 *   skeleton, empty state with optional write CTA, or a grouped Card with
 *   JournalEntryRow rows separated by Separator dividers.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   DisplayEntry          — { id, title?, preview?, time, promptCount? }
 *   DateEntriesCardProps  — full prop contract
 *   DateEntriesCard       — stateless presentational component
 *
 * DEPENDENCIES:
 *   JournalEntryRow (components/journal/journal-entry-row)
 *   shadcn Card, CardContent, Separator, Skeleton, Button
 *   lucide-react
 *
 * LAST UPDATED: 2026-04-27 — created; extracted from home page; used on home + slug detail pages
 */
import { JournalEntryRow } from "@/components/journal/journal-entry-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Pencil } from "lucide-react";

export interface DisplayEntry {
  id: string;
  title?: string | null;
  preview?: string | null;
  time: string;
  promptCount?: number;
}

export interface DateEntriesCardProps {
  selectedLabel: string;
  entries: DisplayEntry[];
  isLoading: boolean;
  /** When provided and today has no entries, a "Start Journaling" CTA is shown. */
  onWriteNew?: () => void;
  /** Set true when the selected date is today — controls empty-state copy + CTA. */
  isToday?: boolean;
  /** Called when an entry row is tapped. */
  onEntryClick?: (entry: DisplayEntry) => void;
}

export function DateEntriesCard({
  selectedLabel,
  entries,
  isLoading,
  onWriteNew,
  isToday = false,
  onEntryClick,
}: DateEntriesCardProps) {
  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">{selectedLabel}</h2>
        {entries.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {isLoading ? (
        <Card className="p-0">
          <CardContent className="py-0 px-3">
            {[0, 1].map((i) => (
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
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isToday ? "No entry today yet" : "Nothing written this day"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isToday
                ? "Take a moment to reflect — it only takes a minute."
                : "No journal entries for this date."}
            </p>
          </div>
          {isToday && onWriteNew && (
            <Button className="rounded-xl px-6 gap-2" onClick={onWriteNew}>
              <Pencil className="w-3.5 h-3.5" />
              Start Journaling
            </Button>
          )}
        </div>
      ) : (
        <Card className="p-0">
          <CardContent className="py-0 px-3">
            {entries.map((entry, i) => (
              <div key={entry.id} onClick={() => onEntryClick?.(entry)}>
                <JournalEntryRow
                  title={entry.title}
                  preview={entry.preview}
                  time={entry.time}
                  promptCount={entry.promptCount}
                />
                {i < entries.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
