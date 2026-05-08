/**
 * FILE: app/(auth)/documents/loading.tsx
 *
 * PURPOSE:
 *   Loading skeleton for the Documents page. Displays placeholders while data is fetched.
 *
 * LOGIC OVERVIEW:
 *   Mirrors the real DocumentsPage layout: a PageHeader-style sticky bar
 *   (back button + title + Upload button), then an "All Files" section with
 *   a grouped list card containing 5 document-row skeletons separated by
 *   thin dividers — matching DocumentCard rows on the actual page.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   DocumentsLoading — default export, no props
 *
 * DEPENDENCIES:
 *   @/components/ui/skeleton
 *   @/components/ui/card
 *   @/components/ui/separator
 *
 * LAST UPDATED: 2026-05-08 — Realign skeleton to match DocumentsPage structure
 */
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <main className="bg-background pb-24" aria-label="Loading documents">
      {/* PageHeader skeleton: back button + title on the left, Upload button on the right */}
      <div className="sticky top-[env(safe-area-inset-top)] z-20 bg-background">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-5 w-36 rounded" />
          </div>
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      <div className="px-4 space-y-4" role="status" aria-busy="true">
        <section>
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
          <Card>
            <CardContent className="py-2 px-3 divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 py-3">
                    {/* GlyphTile-sized icon (md → w-11 h-11 rounded-[12px]) */}
                    <Skeleton className="w-11 h-11 rounded-[12px] shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/3 rounded" />
                    </div>
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  </div>
                  {i < 4 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
