'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import { useSelfJournaling } from '@/hooks/self-journaling/use-self-journaling';

export default function JournalDatePage() {
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;

  const { entries: allEntries, isLoading } = useSelfJournaling();

  const entries = useMemo(
    () =>
      allEntries
        .filter((e) => {
          const d = new Date(e.createdAt);
          return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === date;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allEntries, date]
  );

  const formattedDate = (() => {
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      });
    } catch {
      return date;
    }
  })();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-4 border-b border-border">
        <BackButton fallback="/self-journaling" />
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
            <Button className="rounded-full" onClick={() => router.push('/self-journaling/new')}>
              Write now
            </Button>
          </div>
        ) : (
          entries.map((entry, i) => (
            <article key={entry.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Entry {i + 1}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {entry.prompts && entry.prompts.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {entry.prompts.map((prompt, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      {prompt.heading && (
                        <div className="border-l-4 border-primary pl-3 py-1.5 bg-primary/5 rounded-r-md">
                          <p className="text-sm font-semibold text-primary">{prompt.heading}</p>
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
            </article>
          ))
        )}
      </div>
    </div>
  );
}
