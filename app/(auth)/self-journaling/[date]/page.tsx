'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

interface JournalPrompt {
  heading: string;
  text: string;
}

interface JournalEntry {
  id: string;
  entry?: string;
  prompts?: JournalPrompt[];
  createdAt: string;
}

export default function JournalDatePage() {
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;
  const { user } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserId = useCallback(() => {
    if (!user) return null;
    return user.lead_id ? String(user.lead_id) : null;
  }, [user]);

  const fetchEntries = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setIsLoading(false); return; }

    try {
      const { database } = await import('@/lib/firebase');
      const { ref, get } = await import('firebase/database');
      const snap = await get(ref(database, `self-journalings/${userId}`));

      if (snap.exists()) {
        const arr: JournalEntry[] = [];
        snap.forEach((child) => {
          arr.push({ id: child.key ?? '', ...(child.val() as Omit<JournalEntry, 'id'>) });
        });

        const filtered = arr.filter((e) => {
          const d = new Date(e.createdAt);
          return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === date;
        });

        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEntries(filtered);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId, date]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
