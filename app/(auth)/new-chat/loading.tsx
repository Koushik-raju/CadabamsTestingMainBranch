import { Skeleton } from '@/components/ui/skeleton';

export default function NewChatLoading() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* AI bubble */}
        <div className="flex items-end gap-2">
          <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
          <Skeleton className="h-20 w-64 rounded-2xl rounded-bl-sm" />
        </div>
        {/* User bubble */}
        <div className="flex justify-end">
          <Skeleton className="h-12 w-48 rounded-2xl rounded-br-sm" />
        </div>
        {/* AI bubble */}
        <div className="flex items-end gap-2">
          <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
          <Skeleton className="h-16 w-56 rounded-2xl rounded-bl-sm" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="flex-1 h-10 rounded-2xl" />
        <Skeleton className="w-9 h-9 rounded-full" />
      </div>
    </div>
  );
}
