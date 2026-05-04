/**
 * FILE: components/chat/history/loading-state.tsx
 *
 * PURPOSE:
 *   Skeleton placeholder for the chat history list while threads are loading.
 *   Matches the exact shape of the real ThreadList so there is zero layout shift.
 *
 * LOGIC OVERVIEW:
 *   - Renders a fake section heading row (two Skeletons).
 *   - Renders 4 skeleton rows inside a single grouped Card with Separators —
 *     mirrors the ThreadList grouped-card structure exactly.
 *   - Skeleton tile uses rounded-2xl to match the gradient icon tile shape.
 *
 * DEPENDENCIES:
 *   Skeleton, Card, CardContent, Separator — shadcn/ui primitives
 *
 * LAST UPDATED: 2026-05-04 — grouped-card skeleton matching redesigned ThreadList
 */
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_COUNT = 4;

export function LoadingState() {
  return (
    <div className="px-4 py-3">
      {/* Section heading skeleton */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>

      <Card className="rounded-3xl shadow-[var(--sh-2)] border border-border">
        <CardContent className="py-0 px-3">
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 py-3">
                {/* Matches GlyphTile md: w-11 h-11 rounded-[12px] */}
                <Skeleton className="w-11 h-11 rounded-[12px] flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3 rounded" />
                  <Skeleton className="h-3 w-5/6 rounded" />
                </div>
                <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
              </div>
              {i < ROW_COUNT - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
