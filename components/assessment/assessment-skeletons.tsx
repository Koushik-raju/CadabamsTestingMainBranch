'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function BrowseSkeleton() {
  return (
    <div className="space-y-3 mt-4">
      {/* Hero card skeleton */}
      <Skeleton className="h-44 w-full rounded-2xl" />

      {/* Rich single-column card skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
          {/* Header: icon + title */}
          <div className="flex items-start gap-3">
            <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <Skeleton className="h-3.5 w-4/5 rounded" />
              <Skeleton className="h-2.5 w-1/3 rounded" />
            </div>
          </div>
          {/* Description lines */}
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-full rounded" />
            <Skeleton className="h-2.5 w-5/6 rounded" />
            <Skeleton className="h-2.5 w-3/4 rounded" />
          </div>
          {/* Footer */}
          <Separator />
          <div className="flex gap-4">
            <Skeleton className="h-2.5 w-14 rounded" />
            <Skeleton className="h-2.5 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssignmentsSkeleton() {
  return (
    <Card className="mt-4">
      <CardContent className="py-0 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex items-center gap-3 py-3">
              <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
              <Skeleton className="w-4 h-4 rounded" />
            </div>
            {i < 3 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
