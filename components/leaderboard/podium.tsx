'use client';

import { Crown, Medal, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { LeaderboardEntryData } from './leaderboard-entry';

interface PodiumProps {
  top3: LeaderboardEntryData[];
}

interface PodiumSlotProps {
  entry: LeaderboardEntryData;
  position: 1 | 2 | 3;
}

function PodiumSlot({ entry, position }: PodiumSlotProps) {
  const initials = entry.name
    ? entry.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const config = {
    1: {
      icon: <Crown className="w-5 h-5 text-yellow-500" />,
      barHeight: 'h-20',
      barClass: 'leaderboard-podium-gold',
      avatarRing: 'ring-2 ring-yellow-400',
      label: '1st',
      order: 'order-2',
    },
    2: {
      icon: <Medal className="w-5 h-5 text-slate-400" />,
      barHeight: 'h-14',
      barClass: 'leaderboard-podium-silver',
      avatarRing: 'ring-2 ring-slate-400',
      label: '2nd',
      order: 'order-1',
    },
    3: {
      icon: <Award className="w-5 h-5 text-amber-600" />,
      barHeight: 'h-10',
      barClass: 'leaderboard-podium-bronze',
      avatarRing: 'ring-2 ring-amber-500',
      label: '3rd',
      order: 'order-3',
    },
  }[position];

  return (
    <div className={cn('flex flex-col items-center gap-1 flex-1', config.order)}>
      {/* Crown/Medal icon */}
      <div aria-hidden="true">{config.icon}</div>

      {/* Avatar */}
      <Avatar className={cn('w-12 h-12', config.avatarRing)}>
        <AvatarImage src={entry.profileImage} alt={entry.name} />
        <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p className="text-xs font-semibold text-center text-foreground truncate w-full px-1 max-w-[80px]">
        {entry.name.split(' ')[0]}
      </p>

      {/* Score */}
      <p className="text-xs text-muted-foreground font-medium">
        {entry.score.toLocaleString()} pts
      </p>

      {/* Podium bar */}
      <div
        className={cn(
          'w-full rounded-t-lg flex items-center justify-center font-bold text-white text-sm',
          config.barHeight,
          config.barClass,
        )}
        aria-hidden="true"
      >
        {config.label}
      </div>
    </div>
  );
}

export function Podium({ top3 }: PodiumProps) {
  if (top3.length === 0) return null;

  return (
    <div
      className="flex items-end gap-2 px-4 pb-0 pt-4"
      role="region"
      aria-label="Top 3 leaderboard podium"
    >
      {top3[1] && <PodiumSlot entry={top3[1]} position={2} />}
      {top3[0] && <PodiumSlot entry={top3[0]} position={1} />}
      {top3[2] && <PodiumSlot entry={top3[2]} position={3} />}
    </div>
  );
}
