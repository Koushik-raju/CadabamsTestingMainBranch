import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsLoading() {
  return (
    <main className="min-h-screen bg-background" aria-label="Loading documents">
      <div className="bg-primary pb-4 px-4 rounded-b-[2.5rem]">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32 bg-white/20" />
              <Skeleton className="h-3 w-20 bg-white/20" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg bg-white/20" />
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-3" role="status" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
