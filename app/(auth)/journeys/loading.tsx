import { Skeleton } from "@/components/ui/skeleton";

export default function JourneysLoading() {
  return (
    <div className="min-h-screen bg-background pb-24 pt-5 px-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      {/* Active journeys */}
      <Skeleton className="h-5 w-32 mb-3" />
      <div className="flex flex-col gap-3 mb-6">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-[90px] w-full rounded-xl" />
        ))}
      </div>
      {/* Explore */}
      <Skeleton className="h-5 w-40 mb-3" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
