import { Skeleton } from '@/components/ui/skeleton';

export default function StressManagementLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      <div className="bg-primary/20 px-4 pt-12 pb-8">
        <Skeleton className="h-8 w-40 mb-6 bg-white/20" />
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-20 w-20 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-24 bg-white/20" />
        </div>
      </div>
      <div className="px-4 pt-6 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}
