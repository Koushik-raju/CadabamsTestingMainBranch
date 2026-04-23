import { Skeleton } from "@/components/ui/skeleton";

export default function ChatHistoryLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Safe-area top */}
      <div className="pt-[max(env(safe-area-inset-top,0px),1rem)]" />

      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-4 pb-4">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Cards skeleton */}
      <div className="px-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
          >
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-4 h-4 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
