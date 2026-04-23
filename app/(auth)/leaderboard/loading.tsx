import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <main className="min-h-screen bg-background" aria-label="Loading leaderboard">
      {/* Header skeleton */}
      <div className="bg-primary pb-4 px-4 rounded-b-[2.5rem]">
        <div className="flex items-center gap-3 pt-4 pb-2">
          <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32 bg-white/20" />
            <Skeleton className="h-3 w-20 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto" role="status" aria-busy="true">
        {/* Podium skeleton */}
        <Skeleton className="h-48 w-full rounded-xl" />

        {/* List skeletons */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
