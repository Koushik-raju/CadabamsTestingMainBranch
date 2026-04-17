/**
 * FILE: app/(auth)/self-journaling/loading.tsx
 *
 * PURPOSE:
 *   Streaming loading skeleton for the Self Journaling home page shown by
 *   Next.js while the page component suspends.
 *
 * LOGIC OVERVIEW:
 *   Renders placeholder Skeleton shapes that match the real page layout —
 *   header, free-writing hero card, category grid rows, and entry list rows —
 *   so there is no layout shift when content arrives.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalLoading  — default export, rendered automatically by Next.js
 *
 * DEPENDENCIES:
 *   Skeleton — shadcn/ui loading placeholder
 *
 * LAST UPDATED: 2026-04-17 — Design compliance: pt-5 header, pb-24 root.
 */
import { Skeleton } from '@/components/ui/skeleton';

export default function JournalLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 px-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 pt-5 pb-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="flex flex-col gap-6 mt-2">
        {/* Hero free-writing card */}
        <Skeleton className="h-28 rounded-2xl" />

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>

        {/* Recent reflections list */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3 rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
              <Skeleton className="w-8 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
