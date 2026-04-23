import { Skeleton } from "@/components/ui/skeleton";

export default function MindfulMinutesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 flex items-center gap-3 border-b border-border">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Banner skeleton */}
        <Skeleton className="h-28 w-full rounded-2xl" />

        {/* Category pills */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>

        {/* Featured item */}
        <Skeleton className="h-32 w-full rounded-2xl" />

        {/* List items */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 p-3 border border-border rounded-2xl">
            <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-14 rounded" />
                <Skeleton className="h-4 w-14 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
