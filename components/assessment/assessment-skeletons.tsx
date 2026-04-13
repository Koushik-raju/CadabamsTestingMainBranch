'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface BrowseSkeletonProps {
  className?: string;
}

export function BrowseSkeleton({ className = '' }: BrowseSkeletonProps) {
  return (
    <div className={`space-y-6 mt-4 ${className}`}>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function AssignmentsSkeleton({ className = '' }: BrowseSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 mt-4 ${className}`}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}
