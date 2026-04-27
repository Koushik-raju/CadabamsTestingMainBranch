/**
 * FILE: app/(auth)/self-journaling/[date]/page.tsx
 *
 * PURPOSE:
 *   Shows all journal entries written on a specific date, grouped into a
 *   single card with separators between individual entries.
 *
 * LOGIC OVERVIEW:
 *   1. Reads the [date] route param (local ISO date string, e.g. "2026-04-27").
 *   2. Fetches all entries via useSelfJournaling() (reads JournalEntry table).
 *   3. Filters entries by journaledAt using local date comparison (same helper as
 *      home page) so the timezone matches what the date strip shows.
 *   4. Renders each entry: prompts (heading + text blocks) or plain entryText.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   date           — local ISO date string from route params
 *   entries        — filtered JournalEntryResponseDto[] for the given date
 *   formattedDate  — human-readable date string shown in the header
 *
 * DEPENDENCIES:
 *   useSelfJournaling() — SWR hook (hooks/self-journaling/use-self-journaling.ts)
 *   PageHeader          — shared navigation header component
 *
 * LAST UPDATED: 2026-04-27 — switched to useSelfJournaling (JournalEntry table);
 *   filter uses local journaledAt to match home page date strip.
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelfJournaling } from "@/hooks/self-journaling/use-self-journaling";
import type { JournalEntryResponseDto } from "@/hooks/self-journaling/use-self-journaling";
import { extractString } from "@/hooks/use-journaling";
import { BookOpen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

/** Timezone-safe local date string: "2026-04-17" */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function JournalDatePage() {
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;
  const { entries: allEntries, isLoading } = useSelfJournaling();

  /*
   * Filter by journaledAt (canonical journal date) using local date string so
   * entries created at e.g. 23:00 IST appear on the correct local date rather
   * than the next UTC date.
   */
  const entries = useMemo(
    () =>
      allEntries.filter((e) => {
        const d = new Date(e.journaledAt);
        return !isNaN(d.getTime()) && toLocalDateStr(d) === date;
      }),
    [allEntries, date],
  );

  const formattedDate = (() => {
    try {
      return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return date;
    }
  })();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <PageHeader title={formattedDate} fallback="/self-journaling" />

      <div className="flex-1 px-4 pt-4 flex flex-col gap-4">
        {isLoading ? (
          <Card className="p-0">
            <CardContent className="py-0 px-4">
              {[...Array(2)].map((_, i) => (
                <div key={i}>
                  <div className="py-4 flex flex-col gap-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-16 rounded" />
                      <Skeleton className="h-3 w-10 rounded" />
                    </div>
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                  {i < 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No entries for this date</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Nothing was written on this day yet.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => router.push("/self-journaling/new")}
            >
              Write now
            </Button>
          </div>
        ) : (
          <Card className="p-0">
            <CardContent className="py-0 px-4">
              {entries.map((entry, i) => (
                <EntryBlock key={entry.id} entry={entry} index={i} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EntryBlock({ entry, index }: { entry: JournalEntryResponseDto; index: number }) {
  const time = new Date(entry.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasPrompts = Array.isArray(entry.prompts) && entry.prompts.length > 0;
  const plainText = extractString(entry.entryText);

  return (
    <>
      {index > 0 && <Separator />}
      <div className="py-4 flex flex-col gap-4">
        {/* Entry header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Entry {index + 1}
          </span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>

        {/* Entry body */}
        {hasPrompts ? (
          <div className="flex flex-col gap-4">
            {(entry.prompts as Array<{ heading?: string; text?: string }>).map((prompt, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                {prompt.heading && (
                  <div className="border-l-4 border-primary pl-3 py-1.5 bg-primary/5 rounded-r-md">
                    <p className="text-sm font-semibold text-primary">{prompt.heading}</p>
                  </div>
                )}
                {prompt.text && (
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed ml-1">
                    {prompt.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          plainText && (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {plainText}
            </p>
          )
        )}
      </div>
    </>
  );
}
