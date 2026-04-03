import { Skeleton } from '@/components/ui/skeleton';

export default function JournalLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-28 px-4">
      <div className="flex items-center gap-2 pt-12 pb-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="flex flex-col gap-6 mt-2">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 flex-1 rounded-2xl" />)}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}
