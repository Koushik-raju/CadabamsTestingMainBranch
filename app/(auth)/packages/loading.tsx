import { Skeleton } from '@/components/ui/skeleton';

export default function PackagesLoading() {
  return (
    <div className="min-h-screen bg-background px-4 pt-safe pb-20">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      {/* CTA button skeleton */}
      <Skeleton className="h-11 w-full rounded-full mb-6" />

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-px w-full" />
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
