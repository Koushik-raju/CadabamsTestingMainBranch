"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJournalingCategories } from "@/hooks/use-journaling";
import type { SubJournalingItem } from "@/hooks/use-journaling";
import { ChevronLeft, Clock, Pencil, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { categories, isLoading } = useJournalingCategories();
  const [selectedSub, setSelectedSub] = useState<SubJournalingItem | null>(null);

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const publishedSubs = useMemo(
    () => (category?.subJournalings ?? []).filter((s) => s.status === "PUBLISHED"),
    [category],
  );

  const handleStartWriting = (sub: SubJournalingItem) => {
    // Store long AI prompts in sessionStorage
    if (sub.aiPrompt && sub.aiPrompt.length > 1000) {
      sessionStorage.setItem("pending_ai_prompt", sub.aiPrompt);
    }
    const params = new URLSearchParams({
      title: sub.title,
      subJournalId: sub.id,
      categoryId,
      slug: sub.slug,
    });
    if (sub.aiPrompt && sub.aiPrompt.length <= 1000) {
      params.set("aiPrompt", sub.aiPrompt);
    }
    router.push(`/self-journaling/new?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex items-center gap-2 px-4 pt-12 pb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="px-4 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <p className="text-muted-foreground">Category not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{category.title}</h1>
          {category.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary text-xs"
          onClick={() => router.push(`/self-journaling/history?categoryId=${categoryId}`)}
        >
          <Clock className="w-3.5 h-3.5 mr-1" />
          History
        </Button>
      </div>

      {/* Sub-journalings grid */}
      <div className="px-4">
        {publishedSubs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">
              No journals available in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {publishedSubs.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className="bg-card border border-border rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Icon area */}
                <div className="aspect-[16/10] bg-primary/10 flex items-center justify-center relative overflow-hidden">
                  {sub.icon ? (
                    <span className="text-3xl">{sub.icon}</span>
                  ) : (
                    <Pencil className="w-8 h-8 text-primary/40" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1">
                    {sub.title}
                  </h3>
                  {sub.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {sub.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSub && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setSelectedSub(null)}
        >
          <div
            className="bg-background w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-background z-10 flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-lg font-bold text-foreground">{selectedSub.title}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setSelectedSub(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal visual */}
            <div className="mx-5 aspect-[16/8] bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              {selectedSub.icon ? (
                <span className="text-5xl">{selectedSub.icon}</span>
              ) : (
                <Pencil className="w-12 h-12 text-primary/30" />
              )}
            </div>

            {/* Description */}
            {selectedSub.description && (
              <div className="px-5 mb-4">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedSub.description}
                </p>
              </div>
            )}

            {/* Cadence info */}
            {selectedSub.recommendedCadence && (
              <div className="mx-5 mb-4 bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Recommended: </span>
                  {selectedSub.recommendedCadence.replace(/_/g, " ")}
                </p>
              </div>
            )}

            {/* Info box */}
            <div className="mx-5 mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-sm text-foreground/80 text-center">
                Prepare to share your thoughts through this guided reflection
              </p>
            </div>

            {/* Start Writing Button */}
            <div className="px-5 pb-8">
              <Button
                className="w-full rounded-full h-12 text-base font-semibold"
                onClick={() => {
                  setSelectedSub(null);
                  handleStartWriting(selectedSub);
                }}
              >
                Start Writing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
