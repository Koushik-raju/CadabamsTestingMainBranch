/**
 * FILE: app/(auth)/wellness/mindful-minutes/page.tsx
 *
 * PURPOSE:
 *   Index page listing all mindful minute collections. Each item is a collection
 *   of audio sessions — tapping a card navigates to the detail (slug) page.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches all mindful minute collections via useMindfulMinutes().
 *   2. Supports category filter and text search.
 *   3. In overview mode: shows a featured card + remaining items list + category grid.
 *   4. In list mode (category selected or "View all" tapped): shows full filtered list.
 *   5. Cards navigate to /wellness/mindful-minutes/[slug]; no audio plays on this page.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   items            — full list of MindfulMinute collections from SWR
 *   filteredItems    — items after category + search filter
 *   featuredItem     — first item, shown in hero card in overview mode
 *   isListView       — true when category is selected or viewMode === 'list'
 *
 * DEPENDENCIES:
 *   useMindfulMinutes() — SWR hook for all collections
 *   getStrapiImageUrl   — resolves Strapi image paths
 *
 * LAST UPDATED: 2026-04-23 — migrated sticky header to PageHeader
 */

"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryFilter } from "@/components/wellness/category-filter";
import { useMindfulMinutes } from "@/hooks/wellness/use-mindful-minutes";
import { getStrapiImageUrl } from "@/lib/strapi-fetcher";
import { ChevronRight, RefreshCw, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function MindfulMinutesPage() {
  const router = useRouter();
  const { items, categories, isLoading, error, mutate } = useMindfulMinutes();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"overview" | "list">("overview");

  const filteredItems = useMemo(() => {
    return items.filter((v) => {
      const matchCat = selectedCategory === "All" || v.category === selectedCategory;
      const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const featuredItem = items[0];
  const isListView = viewMode === "list" || selectedCategory !== "All";

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-muted-foreground text-center">No mindful minutes available.</p>
        <Button onClick={() => mutate()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title={isListView ? "Audio resets" : "Quick relief"}
        subtitle={
          isLoading
            ? "Loading…"
            : isListView
              ? `${filteredItems.length} sessions available`
              : "Breath, audio & visual resets · Under 5 min"
        }
        fallback="/home"
        className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3"
        right={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 rounded-full border-border bg-muted text-sm w-28 md:w-40"
              aria-label="Search mindful minutes"
            />
          </div>
        }
      />

      <main className="flex-1 px-4 py-4 space-y-6 max-w-2xl mx-auto w-full pb-20">
        {/* Banner */}
        {!isListView && (
          <div className="bg-primary/10 rounded-2xl p-5 flex items-center gap-5 border border-primary/20">
            <div className="w-[90px] h-[80px] relative rounded-xl overflow-hidden flex-shrink-0 bg-background flex items-center justify-center">
              <div className="text-4xl">🧘</div>
            </div>
            <div className="flex-1">
              <h2 className="text-[17px] font-extrabold text-foreground leading-tight mb-1">
                Need a reset in under 5 minutes?
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Pick a quick audio or visualization to calm your body and mind.
              </p>
            </div>
          </div>
        )}

        {/* Category filter */}
        {!isLoading && categories.length > 1 && (
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={(cat) => {
              setSelectedCategory(cat);
              setViewMode(cat !== "All" ? "list" : "overview");
            }}
          />
        )}

        {/* Featured */}
        {!isListView && featuredItem && !isLoading && (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className="font-bold text-foreground text-[17px]">Featured reset</h3>
              <button
                onClick={() => setViewMode("list")}
                className="text-[13px] font-bold text-primary"
              >
                View all audio
              </button>
            </div>
            <div
              onClick={() => router.push(`/wellness/mindful-minutes/${featuredItem.slug}`)}
              className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
            >
              <div className="p-4 flex gap-5">
                <div className="relative w-32 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border/50">
                  {featuredItem.coverImageUrl ? (
                    <Image
                      src={getStrapiImageUrl(featuredItem.coverImageUrl) ?? "/placeholder.png"}
                      alt={featuredItem.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🎵
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-foreground text-[17px] leading-tight">
                      {featuredItem.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {featuredItem.category && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded font-bold uppercase tracking-tight">
                          {featuredItem.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-extrabold text-[14px]">
                    Browse sessions
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio list */}
        <div className="space-y-3">
          {!isListView && !isLoading && filteredItems.length > 1 && (
            <h3 className="font-bold text-foreground text-[17px]">Audio &amp; visualizations</h3>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-3 border border-border rounded-2xl">
                  <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-14 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No sessions found.</p>
          ) : (
            <div className="space-y-3">
              {filteredItems.slice(viewMode === "overview" ? 1 : 0).map((item) => (
                <div
                  key={item.slug}
                  onClick={() => router.push(`/wellness/mindful-minutes/${item.slug}`)}
                  className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
                >
                  <div className="p-3 flex gap-4">
                    <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border/30">
                      {item.coverImageUrl ? (
                        <Image
                          src={getStrapiImageUrl(item.coverImageUrl) ?? "/placeholder.png"}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🎵
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <h4 className="font-extrabold text-foreground text-[14px] leading-tight line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {item.category && (
                          <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold">
                            {item.category}
                          </span>
                        )}
                        {item.audios && item.audios.length > 0 && (
                          <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold">
                            {item.audios.length} session{item.audios.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-primary font-extrabold text-[13px] mt-1.5">
                        Browse sessions
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explore categories grid — from API */}
        {!isListView && !isLoading && categories.filter((c) => c !== "All").length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-foreground text-[17px]">Explore categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories
                .filter((c) => c !== "All")
                .map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setViewMode("list");
                    }}
                    className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform min-h-[100px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-xl">🎧</span>
                    </div>
                    <h4 className="font-extrabold text-foreground text-[15px] leading-tight">
                      {cat}
                    </h4>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
