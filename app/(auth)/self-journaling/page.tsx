'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Pencil, Sun, Moon, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { JournalEntryCard } from '@/components/journal/journal-entry-card';

interface JournalPrompt {
  heading: string;
  text: string;
}

interface JournalEntry {
  id: string;
  entry?: string;
  prompts?: JournalPrompt[];
  createdAt: string;
  timestamp?: number;
}

const GUIDED_REFLECTIONS = [
  {
    id: 'gratitude',
    title: 'Gratitude',
    description: '3 min focus',
    Icon: Sun,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    template: 'gratitude',
  },
  {
    id: 'sleeplog',
    title: 'Sleep Log',
    description: 'Evening reset',
    Icon: Moon,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50',
    template: 'sleeplog',
  },
  {
    id: 'affirmations',
    title: 'Affirmations',
    description: 'Daily boost',
    Icon: Sparkles,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    template: 'affirmations',
  },
];

function calculateStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const dates = [
    ...new Set(
      entries.map((e) => {
        const d = new Date(e.createdAt);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
      })
    ),
  ]
    .filter((d): d is string => d !== null)
    .sort((a, b) => (a < b ? 1 : -1));

  let streak = 0;
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  const todayStr = current.toISOString().split('T')[0];

  if (dates[0] !== todayStr) {
    current.setDate(current.getDate() - 1);
    if (dates[0] !== current.toISOString().split('T')[0]) return 0;
  }

  for (const d of dates) {
    if (d === current.toISOString().split('T')[0]) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else if (d < current.toISOString().split('T')[0]) {
      break;
    }
  }
  return streak;
}

export default function JournalHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserId = useCallback(() => {
    if (!user) return null;
    return user.lead_id ? String(user.lead_id) : null;
  }, [user]);

  const fetchJournals = useCallback(async () => {
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
        arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJournals(arr);
      }
    } catch (err) {
      console.error('Error fetching journals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const streak = useMemo(() => calculateStreak(journals), [journals]);

  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay(); // 0 = Sunday
    const offset = day === 0 ? -6 : 1 - day; // Monday start
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset + i);
      const dateStr = d.toISOString().split('T')[0];
      const hasEntry = journals.some((j) => {
        const jd = new Date(j.createdAt);
        return jd.toISOString().split('T')[0] === dateStr;
      });
      return {
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' })[0],
        dayNum: d.getDate(),
        isToday: dateStr === today.toISOString().split('T')[0],
        hasEntry,
      };
    });
  }, [journals]);

  const recentJournals = journals.slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Journal</h1>
          <p className="text-sm text-muted-foreground">Your safe space for thoughts</p>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-6">
        {/* Free Flow CTA */}
        <button
          onClick={() => router.push('/self-journaling/new')}
          className="w-full bg-primary text-primary-foreground rounded-2xl p-6 flex items-center justify-between min-h-[120px] relative overflow-hidden text-left"
        >
          <div className="z-10">
            <h2 className="text-2xl font-bold mb-1">Free Flow</h2>
            <p className="text-sm text-white/80 max-w-[180px] leading-tight">
              Write whatever is on your mind. No prompts, just you.
            </p>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-md">
            <Pencil className="w-5 h-5 text-primary" />
          </div>
          <Pencil
            className="absolute right-[-20px] bottom-[-20px] text-white/5 rotate-12 pointer-events-none"
            size={140}
          />
        </button>

        {/* Guided Reflections */}
        <section>
          <h3 className="text-base font-bold text-foreground mb-3">Guided Reflection</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {GUIDED_REFLECTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(`/self-journaling/new?template=${item.template}`)}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-5 min-w-[140px] text-left flex-shrink-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bgColor}`}>
                  <item.Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Daily tracker */}
        <section>
          <Card className="cursor-pointer" onClick={() => router.push('/self-journaling/new')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-foreground">Daily Gratitude</h3>
                  <p className="text-sm text-muted-foreground">Your daily mindful pause</p>
                </div>
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {streak} day streak
                  </span>
                </div>
              </div>

              {/* Week view */}
              <div className="bg-muted rounded-xl p-2 flex justify-between">
                {weekDays.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {day.dayName}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        day.hasEntry || day.isToday
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-foreground'
                      }`}
                    >
                      {day.dayNum}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent entries */}
        {!isLoading && recentJournals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Recent Entries</h3>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => router.push('/self-journaling/history')}>
                View all
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {recentJournals.map((j) => (
                <JournalEntryCard
                  key={j.id}
                  id={j.id}
                  entry={j.entry}
                  prompts={j.prompts}
                  createdAt={j.createdAt}
                />
              ))}
            </div>
          </section>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed right-4 z-50" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <Button
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg"
          onClick={() => router.push('/self-journaling/new')}
          aria-label="New journal entry"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
