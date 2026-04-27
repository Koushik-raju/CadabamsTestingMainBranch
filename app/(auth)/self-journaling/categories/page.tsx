/**
 * FILE: app/(auth)/self-journaling/categories/page.tsx
 *
 * PURPOSE:
 *   "View All" page for Guided Reflection categories. Displays every published
 *   category in a 2-column grid with cover image or gradient tile fallback.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches published categories via useJournalingCategories().
 *   2. Filters to PUBLISHED status.
 *   3. Renders a 2-col grid; each card shows cover image (if any) or gradient tile.
 *   4. Tapping a card navigates to /self-journaling/categories/[id].
 *   5. Shows skeleton grid while loading, empty state when none are available.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   publishedCategories — PUBLISHED JournalingResponseDto[]
 *
 * DEPENDENCIES:
 *   useJournalingCategories() — hooks/use-journaling.ts
 *   PageHeader                — components/shared/navigation/page-header.tsx
 *   getJournalVisual()        — lib/journal-visual.ts
 *
 * LAST UPDATED: 2026-04-27 — category filter uses sub-journaling status (parent may be DRAFT)
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { extractString, useJournalingCategories } from "@/hooks/use-journaling";
import type { JournalingResponseDto } from "@/hooks/use-journaling";
import { getJournalVisual } from "@/lib/journal-visual";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Grid Card
// ---------------------------------------------------------------------------

function CategoryGridCard({
  category,
  onClick,
}: {
  category: JournalingResponseDto;
  onClick: () => void;
}) {
  const { gradient, Icon } = getJournalVisual(category.title);
  const subCount = category.subJournalings?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] w-full"
    >
      {extractString(category.icon) ? (
        <div className="h-24 relative overflow-hidden">
          <Image
            src={extractString(category.icon)}
            alt={category.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        </div>
      ) : (
        <div
          className={cn(
            "h-24 bg-gradient-to-br flex items-center justify-center relative overflow-hidden",
            gradient,
          )}
        >
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-5 -left-3 w-20 h-20 rounded-full bg-white/5" />
          <Icon className="w-9 h-9 text-white/90 relative z-10" />
        </div>
      )}

      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1">
          {category.title}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {subCount} {subCount === 1 ? "journal" : "journals"}
        </p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AllCategoriesPage() {
  const router = useRouter();
  const { categories, isLoading } = useJournalingCategories();

  /*
   * Show categories that have at least one PUBLISHED sub-journaling.
   * Parent CmsJournaling records in the DB commonly have status DRAFT even when
   * their children are PUBLISHED, so filter by sub-journaling status.
   */
  const publishedCategories = useMemo(
    () => categories.filter((c) => c.subJournalings?.some((s) => s.status === "PUBLISHED")),
    [categories],
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <PageHeader
        title="Guided Reflection"
        subtitle="All available journaling categories."
        fallback="/self-journaling"
      />

      <div className="px-4 mt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : publishedCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No categories available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {publishedCategories.map((cat) => (
              <CategoryGridCard
                key={cat.id}
                category={cat}
                onClick={() => router.push(`/self-journaling/categories/${cat.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
