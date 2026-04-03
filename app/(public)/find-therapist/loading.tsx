import { Skeleton } from '@/components/ui/skeleton';

export default function FindTherapistLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-6 pb-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>
      <div className="px-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-full" />
        ))}
      </div>
    </div>
  );
}
