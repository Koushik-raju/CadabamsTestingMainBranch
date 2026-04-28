/**
 * FILE: app/(auth)/prescriptions/loading.tsx
 *
 * PURPOSE:
 *   Loading skeleton for the Prescriptions page. Displays placeholders while prescriptions data is fetched.
 *
 * LOGIC OVERVIEW:
 *   Renders header skeleton with icon and text placeholders.
 *   Below: 3 card skeletons mimicking prescription list card structure (title, metadata, divider, actions).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   PrescriptionsLoading — default export, no props
 *
 * DEPENDENCIES:
 *   @/components/ui/skeleton
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
import { Skeleton } from "@/components/ui/skeleton";

export default function PrescriptionsLoading() {
  return (
    <div className="min-h-screen bg-background px-4 pb-20">
      {/* Header skeleton */}
      <div className="pt-safe-top pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
