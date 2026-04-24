"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Award, Crown, Medal } from "lucide-react";

export interface LeaderboardEntryData {
  rank: number;
  name: string;
  mobile?: string;
  score: number;
  level?: number;
  profileImage?: string;
  isCurrentUser?: boolean;
}

interface LeaderboardEntryProps {
  entry: LeaderboardEntryData;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" aria-label="1st place" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" aria-label="2nd place" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" aria-label="3rd place" />;
  return null;
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "leaderboard-rank-gold";
  if (rank === 2) return "leaderboard-rank-silver";
  if (rank === 3) return "leaderboard-rank-bronze";
  return "bg-muted text-muted-foreground";
}

export function LeaderboardEntry({ entry }: LeaderboardEntryProps) {
  const initials = entry.name
    ? entry.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
        entry.isCurrentUser
          ? "bg-primary/10 border border-primary/30"
          : "bg-card hover:bg-muted/50",
      )}
      role="listitem"
      aria-label={`Rank ${entry.rank}: ${entry.name}, ${entry.score} points${entry.isCurrentUser ? ", this is you" : ""}`}
    >
      {/* Rank badge */}
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0",
          rankBadgeClass(entry.rank),
        )}
        aria-hidden="true"
      >
        {entry.rank <= 3 ? <RankIcon rank={entry.rank} /> : <span>{entry.rank}</span>}
      </div>

      {/* Avatar */}
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src={entry.profileImage} alt={entry.name} />
        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Name & level */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold truncate text-sm", entry.isCurrentUser && "text-primary")}>
          {entry.name}
          {entry.isCurrentUser && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">(You)</span>
          )}
        </p>
        {entry.level !== undefined && (
          <p className="text-xs text-muted-foreground">Level {entry.level}</p>
        )}
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            "font-bold text-sm",
            entry.isCurrentUser ? "text-primary" : "text-foreground",
          )}
        >
          {entry.score.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </div>
  );
}
