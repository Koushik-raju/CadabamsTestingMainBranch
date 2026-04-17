/**
 * FILE: app/(auth)/self-journaling/[date]/page.tsx
 *
 * PURPOSE:
 *   Shows all journal entries written on a specific date, grouped into a
 *   single card with separators between individual entries.
 *
 * LOGIC OVERVIEW:
 *   1. Reads the [date] route param (ISO date string, e.g. "2024-01-15").
 *   2. Fetches all entries via useSelfJournalingEntries() and filters to the
 *      matching date.
 *   3. Renders each entry as a block inside a single grouped Card with
 *      Separator dividers between entries.
 *   4. Supports both prompt-based and free-text entry formats.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   date           — ISO date string from route params
 *   entries        — filtered SelfJournalingEntry[] for the given date
 *   formattedDate  — human-readable date string shown in the header
 *
 * DEPENDENCIES:
 *   useSelfJournalingEntries() — SWR hook (hooks/use-journaling.ts)
 *   BackButton                 — shared back navigation component
 *
 * LAST UPDATED: 2026-04-17 — Design compliance: BackButton, grouped Card+Separator
 *   layout, pt-5 header, pb-24 root, empty state with icon.
 */
'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/shared/navigation/back-button';
import { useSelfJournalingEntries } from '@/hooks/use-journaling';

export default function JournalDatePage() {
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;
  const { entries: allEntries, isLoading } = useSelfJournalingEntries();

  const entries = useMemo(
    () =>
      allEntries.filter((e) => {
        const d = new Date(e.createdAt);
        return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === date;
      }),
    [allEntries, date],
  );

  const formattedDate = (() => {
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  })();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3 border-b border-border">
        <BackButton fallback="/self-journaling" />
        <div className="flex-1 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <h1 className="text-lg font-bold text-foreground">
            {formattedDate}
          </h1>
        </div>
      </div>

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
              onClick={() => router.push('/self-journaling/new')}
            >
              Write now
            </Button>
          </div>
        ) : (
          <Card className="p-0">
            <CardContent className="py-0 px-4">
              {entries.map((entry, i) => (
                <div key={entry.id}>
                  <div className="py-4 flex flex-col gap-4">
                    {/* Entry header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Entry {i + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Entry body */}
                    {entry.prompts && entry.prompts.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {entry.prompts.map((prompt, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                            {prompt.heading && (
                              <div className="border-l-4 border-primary pl-3 py-1.5 bg-primary/5 rounded-r-md">
                                <p className="text-sm font-semibold text-primary">
                                  {prompt.heading}
                                </p>
                              </div>
                            )}
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed ml-1">
                              {prompt.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {entry.entry}
                      </p>
                    )}

                    {/* Mood / Stress meta */}
                    {(entry.emotion || entry.stressLevel) && (
                      <div className="flex gap-3 pt-2 border-t border-border">
                        {entry.emotion && (
                          <span className="text-xs text-muted-foreground">
                            Mood: {entry.emotion}/5
                          </span>
                        )}
                        {entry.stressLevel && (
                          <span className="text-xs text-muted-foreground">
                            Stress: {entry.stressLevel}/5
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {i < entries.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
