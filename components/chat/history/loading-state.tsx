import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-3 px-4 py-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
        >
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
