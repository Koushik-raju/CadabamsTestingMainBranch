'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Wind, Brain, ClipboardCheck, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { MoodChart } from '@/components/stress/mood-chart';

interface StressEntry {
  id: string;
  stressLevel: number;
  stressReason?: string[];
  stressImpact?: string[];
  createdAt: string;
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very High',
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-lime-100 text-lime-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800',
};

export default function StressManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [latest, setLatest] = useState<StressEntry | null>(null);
  const [history, setHistory] = useState<StressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserId = useCallback(() => {
    if (!user) return null;
    return (user.lead_id as string | number | undefined)
      ? String(user.lead_id)
      : null;
  }, [user]);

  const fetchData = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      const { database } = await import('@/lib/firebase');
      const { ref, get } = await import('firebase/database');
      const snap = await get(ref(database, `stressManagement/user/${userId}`));
      if (snap.exists()) {
        const arr: StressEntry[] = [];
        snap.forEach((child) => {
          arr.push({ id: child.key ?? '', ...(child.val() as Omit<StressEntry, 'id'>) });
        });
        arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatest(arr[0] ?? null);
        setHistory(arr);
      }
    } catch (err) {
      console.error('Error fetching stress data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tools = [
    {
      label: 'Breathing',
      description: 'Guided breathing exercises',
      icon: Wind,
      href: '/stress-management/breathing',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Body Scan',
      description: 'Progressive muscle relaxation',
      icon: Brain,
      href: '/stress-management/body-scan',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Assessments',
      description: 'Explore & track your wellbeing',
      icon: ClipboardCheck,
      href: '/assessments',
      color: 'text-primary bg-primary/10',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/20"
            onClick={() => router.push('/home')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Stress Management</h1>
        </div>

        {/* Current level */}
        <div className="flex flex-col items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-20 w-20 rounded-full bg-white/20" />
          ) : (
            <>
              <div className="text-7xl font-bold leading-none">
                {latest?.stressLevel ?? '—'}
              </div>
              <Badge className={latest ? LEVEL_COLORS[latest.stressLevel] : 'bg-white/20 text-white'}>
                {latest ? LEVEL_LABELS[latest.stressLevel] : 'No data yet'}
              </Badge>
              {latest?.stressReason && latest.stressReason.length > 0 && (
                <p className="text-sm text-white/70 mt-1">{latest.stressReason[0]}</p>
              )}
            </>
          )}
        </div>

        {/* Add button */}
        <div className="flex justify-center mt-4">
          <Link href="/assessments">
            <Button
              size="icon"
              className="rounded-full w-12 h-12 bg-white text-primary hover:bg-white/90 shadow-lg"
              aria-label="Record new stress level"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-4 pt-6 flex flex-col gap-6">
        {/* Quick tools */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Tools</h2>
          <div className="grid grid-cols-3 gap-3">
            {tools.map((tool) => (
              <Link key={tool.label} href={tool.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                    <div className={`rounded-xl p-2.5 ${tool.color}`}>
                      <tool.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{tool.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{tool.description}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* History chart */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Recent History</h2>
          </div>
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex gap-2 items-end h-32">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${40 + i * 15}%` }} />
                  ))}
                </div>
              ) : (
                <MoodChart entries={history.slice(0, 7)} />
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
