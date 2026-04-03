import { Skeleton } from '@/components/ui/skeleton';

export default function WellnessResourcesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="bg-primary/10 px-4 pt-12 pb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Search skeleton */}
        <Skeleton className="h-11 w-full rounded-full" />

        {/* Category filter skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border">
              <Skeleton className="h-[200px] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
