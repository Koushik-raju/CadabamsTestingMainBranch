/**
 * FILE: app/(auth)/leaderboard/page.tsx
 *
 * PURPOSE:
 *   Displays a competitive leaderboard of users ranked by score/level.
 *   Shows top 3 users in a podium layout, rest in scrollable list.
 *   Highlights the current user's position.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches leaderboard data via useLeaderboard() SWR hook.
 *   2. Normalizes backend response to LeaderboardEntryData shape.
 *   3. Slices top 3 entries for podium; remainder for list.
 *   4. Renders header with stats (total entries, current rank, user score).
 *   5. Renders Podium for top 3; LeaderboardEntry list for rest.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   data       — RawLeaderboardEntry[] from useLeaderboard
 *   entries    — normalized LeaderboardEntryData[] for rendering
 *   currentEntry — current user's position (highlighted in list)
 *
 * DEPENDENCIES:
 *   useLeaderboard — SWR hook for ranking data
 *   Podium, LeaderboardEntry — display components
 *   useAuth — for current user identification
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { Star, TrendingUp, Trophy, Zap } from "lucide-react";

import {
  LeaderboardEntry,
  type LeaderboardEntryData,
} from "@/components/leaderboard/leaderboard-entry";
import { Podium } from "@/components/leaderboard/podium";
import { BackButton } from "@/components/shared/navigation/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard } from "@/hooks/leaderboard/use-leaderboard";
import { useAuth } from "@/hooks/use-auth";

// Shape returned by the backend
interface RawLeaderboardEntry {
  name?: string;
  mobile?: string;
  score?: number;
  total_score?: number;
  level?: number;
  profileImage?: string;
  profile_image?: string;
}

function normalize(
  raw: RawLeaderboardEntry,
  idx: number,
  currentMobile?: string,
): LeaderboardEntryData {
  const score = raw.score ?? raw.total_score ?? 0;
  const mobile = raw.mobile ?? "";
  const cleanCurrent = currentMobile ? currentMobile.replace(/\D/g, "") : "";
  return {
    rank: idx + 1,
    name: raw.name ?? `User ${idx + 1}`,
    mobile,
    score,
    level: raw.level,
    profileImage: raw.profileImage ?? raw.profile_image,
    isCurrentUser: Boolean(cleanCurrent && mobile.replace(/\D/g, "") === cleanCurrent),
  };
}

function ScoreCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
      <div className="flex justify-center mb-1" aria-hidden="true">
        {icon}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-white/70 font-medium">{label}</p>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useLeaderboard();

  const currentMobile =
    (user as { caller_mobile?: string } | null)?.caller_mobile ?? user?.phone_number ?? "";

  const entries: LeaderboardEntryData[] = Array.isArray(data)
    ? (data as RawLeaderboardEntry[]).map((item, i) => normalize(item, i, currentMobile))
    : [];

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentEntry = entries.find((e) => e.isCurrentUser);

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Leaderboard page">
      {/* Header */}
      <header className="bg-primary pb-4 px-4 rounded-b-[2.5rem] shadow-[var(--sh-glow-orange)]">
        <div className="flex items-center gap-3 pt-4 pb-2">
          <BackButton fallback="/" className="text-white hover:bg-white/20" />
          <div>
            <h1 className="text-white text-lg font-bold">Leaderboard</h1>
            <p className="text-white/70 text-xs">See how you rank</p>
          </div>
        </div>

        {/* Current user score card */}
        {currentEntry && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-white" aria-hidden="true" />
              <h2 className="text-white font-semibold text-sm">Your Progress</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <ScoreCard
                icon={<Zap className="w-4 h-4 text-white/80" />}
                label="Level"
                value={currentEntry.level ?? "—"}
              />
              <ScoreCard
                icon={<TrendingUp className="w-4 h-4 text-white/80" />}
                label="Points"
                value={currentEntry.score.toLocaleString()}
              />
              <ScoreCard
                icon={<Star className="w-4 h-4 text-white/80" />}
                label="Rank"
                value={`#${currentEntry.rank}`}
              />
            </div>
          </div>
        )}
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="space-y-3" role="status" aria-label="Loading leaderboard">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
              <p className="text-muted-foreground">Failed to load leaderboard.</p>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
              <p className="font-semibold text-foreground">No rankings yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete activities to appear on the leaderboard.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium for top 3 */}
            {top3.length > 0 && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <Podium top3={top3} />
                </CardContent>
              </Card>
            )}

            {/* Ranked list for rank 4+ */}
            {rest.length > 0 && (
              <section aria-label="Rankings">
                <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Rankings</h2>
                <div className="space-y-2" role="list">
                  {rest.map((entry) => (
                    <div
                      key={entry.rank}
                      style={{ contentVisibility: "auto", containIntrinsicSize: "0 68px" }}
                    >
                      <LeaderboardEntry entry={entry} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
