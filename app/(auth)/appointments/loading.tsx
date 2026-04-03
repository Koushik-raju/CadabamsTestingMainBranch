import { Skeleton } from '@/components/ui/skeleton';

export default function AppointmentsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-6 pb-4">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="px-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
