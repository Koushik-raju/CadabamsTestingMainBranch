/**
 * FILE: app/(auth)/self-journaling/[date]/page.tsx
 *
 * PURPOSE:
 *   Shows all journal entries logged on a specific date (route param `date`),
 *   filtered client-side from the user's full entry list.
 *
 * LOGIC OVERVIEW:
 *   1. Reads the `date` route param (YYYY-MM-DD).
 *   2. Fetches all entries via useSelfJournalingEntries and filters to those
 *      whose `createdAt` matches `date`.
 *   3. Renders each entry: prompt Q&A pairs when present, otherwise the raw
 *      entryText. Shows emotion and stress level when available.
 *   SDK types several fields (entryText, emotion, stressLevel, prompts) as
 *   `{ [key: string]: unknown }` or `Array<Array<unknown>>` — runtime helpers
 *   (displayVal, parsePrompt) extract plain values safely without type coercion.
 *
 * KEY VARIABLES / EXPORTS:
 *   JournalDatePage — default export.
 *
 * DEPENDENCIES:
 *   useSelfJournalingEntries (hooks/use-journaling)
 *
 * LAST UPDATED: 2026-04-28 — added header; fixed SDK type gaps (displayVal, parsePrompt helpers).
 */
"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelfJournalingEntries } from "@/hooks/use-journaling";
import { Calendar, ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

/*
 * SDK generates entryText, emotion, stressLevel as `{ [key: string]: unknown } | null`
 * and prompts as `Array<Array<unknown>>`. These helpers safely extract the actual
 * string/number values the backend returns without `as T` type coercions.
 */
function displayVal(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return undefined;
}

function parsePrompt(val: unknown): { heading?: string; text?: string } {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const o = val as Record<string, unknown>;
    return {
      heading: typeof o.heading === "string" ? o.heading : undefined,
      text: typeof o.text === "string" ? o.text : undefined,
    };
  }
  return {};
}

export default function JournalDatePage() {
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;
  const { entries: allEntries, isLoading } = useSelfJournalingEntries();

  const entries = useMemo(
    () =>
      allEntries.filter((e) => {
        const d = new Date(e.createdAt);
        return !isNaN(d.getTime()) && d.toISOString().split("T")[0] === date;
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
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h1 className="text-base font-semibold text-foreground">{formattedDate}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20">
            <p className="text-muted-foreground">No journal entries for this date.</p>
            <Button className="rounded-full" onClick={() => router.push("/self-journaling/new")}>
              Write now
            </Button>
          </div>
        ) : (
          entries.map((entry, i) => (
            <article
              key={entry.id}
              className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Entry {i + 1}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {entry.prompts && entry.prompts.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {entry.prompts.map((prompt, idx) => {
                    const p = parsePrompt(prompt);
                    return (
                      <div key={idx} className="flex flex-col gap-2">
                        {p.heading && (
                          <div className="border-l-4 border-primary pl-3 py-1.5 bg-primary/5 rounded-r-md">
                            <p className="text-sm font-semibold text-primary">{p.heading}</p>
                          </div>
                        )}
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed ml-1">
                          {p.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {displayVal(entry.entryText)}
                </p>
              )}

              {(entry.emotion || entry.stressLevel) && (
                <div className="flex gap-3 pt-2 border-t border-border">
                  {entry.emotion && (
                    <span className="text-xs text-muted-foreground">
                      Mood: {displayVal(entry.emotion)}/5
                    </span>
                  )}
                  {entry.stressLevel && (
                    <span className="text-xs text-muted-foreground">
                      Stress: {displayVal(entry.stressLevel)}/5
                    </span>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
