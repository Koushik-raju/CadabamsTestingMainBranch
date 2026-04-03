import { Skeleton } from '@/components/ui/skeleton';

export default function AssessmentsLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-border bg-card">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="p-3 sm:p-4 lg:p-6">
        <Skeleton className="h-10 w-full rounded-lg mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
