'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Wind, Brain, ClipboardCheck, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoodChart } from '@/components/stress/mood-chart';

interface StressEntry {
  id: string;
  stressLevel: number;
  stressReason?: string[];
  stressImpact?: string[];
  createdAt: string;
}

export default function StressManagementPage() {
  const router = useRouter();
  const history: StressEntry[] = [];

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
          <div className="text-7xl font-bold leading-none">—</div>
          <Badge className="bg-white/20 text-white">No data yet</Badge>
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
              <MoodChart entries={history.slice(0, 7)} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
