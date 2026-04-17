'use client';

import { Flame, Gem } from 'lucide-react';
import type { JourneyProgress } from '@/hooks/journeys/use-journey-detail';

interface PathStatsRowProps {
  progress: JourneyProgress;
}

export function PathStatsRow({ progress }: PathStatsRowProps) {
  const pct = progress.progress ?? 0;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <Flame className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">{progress.streak}</span>
        <span className="text-[10px] text-muted-foreground">Streak</span>
      </div>

      {/* Gems */}
      <div className="flex items-center gap-1.5">
        <Gem className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">{progress.gems}</span>
        <span className="text-[10px] text-muted-foreground">Gems</span>
      </div>

      {/* Circular progress */}
      <div className="flex items-center gap-1.5">
        <div className="relative w-8 h-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16" cy="16" r="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
            />
            <circle
              cx="16" cy="16" r="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 13}`}
              strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-500"
            />
          </svg>
        </div>
        <span className="text-[10px] text-muted-foreground">{pct}% Done</span>
      </div>
    </div>
  );
}
