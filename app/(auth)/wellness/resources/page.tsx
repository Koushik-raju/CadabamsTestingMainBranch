'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, RefreshCw, Clock, ChevronRight } from 'lucide-react';
import { BackButton } from '@/components/shared/navigation/back-button';
import { CategoryFilter } from '@/components/wellness/category-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWellnessResources } from '@/hooks/use-wellness-resources';
import { getStrapiImageUrl } from '@/lib/strapi-fetcher';
import type { WellnessResource } from '@/types/wellness';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCategory(cat: string): string {
  return cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type ResourceWithReadTime = WellnessResource & { averageReadTime?: string };

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({
  resource,
  onClick,
  priority = false,
}: {
  resource: WellnessResource;
  onClick: () => void;
  priority?: boolean;
}) {
  const imgUrl =
    getStrapiImageUrl(
      resource.coverImage?.webImage?.url ?? resource.coverImage?.mobileImage?.url
    ) ?? null;

  const categories = Array.isArray(resource.category)
    ? (resource.category as string[])
    : resource.category
    ? [resource.category as string]
    : [];

  const readTime = (resource as ResourceWithReadTime).averageReadTime;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200"
      aria-label={`Read: ${resource.title}`}
    >
      {/* Cover image */}
      <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={resource.title ?? 'Article'}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">📰</span>
          </div>
        )}
        {categories.length > 0 && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded font-bold">
              {formatCategory(categories[0])}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1">
        <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
          {resource.title}
        </p>
        {readTime && (
          <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
            <Clock className="h-3 w-3" />
            <span>{readTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <Skeleton className="w-full" style={{ aspectRatio: '16/9' }} />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Debounce search by 450ms to limit API calls
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 450);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { resources, categories, totalCount, hasMore, isLoading, isLoadingMore, error, loadMore } =
    useWellnessResources({ search: debouncedSearch, category: selectedCategory });

  // IntersectionObserver sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) loadMore();
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const handleCategorySelect = useCallback((cat: string) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    setDebouncedSearch('');
  }, []);

  const isFiltered = selectedCategory !== 'All' || !!debouncedSearch;

  const featuredResource = !isFiltered ? resources[0] : null;
  const gridResources = !isFiltered ? resources.slice(1) : resources;

  if (error && !resources.length) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-muted-foreground text-center">Failed to load resources.</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <BackButton fallback="/home" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground text-base">
              {selectedCategory !== 'All' ? formatCategory(selectedCategory) : 'Resources'}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isLoading
                ? 'Loading…'
                : isFiltered
                ? `${resources.length}${hasMore ? '+' : ''} of ${totalCount} articles`
                : `${totalCount} articles`}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 rounded-full border-border bg-muted text-sm w-28 md:w-40"
              aria-label="Search resources"
            />
          </div>
        </div>
      </div>

      {/* Banner */}
      {!isFiltered && !isLoading && (
        <div className="px-4 pt-4">
          <div className="bg-primary/10 rounded-2xl p-5 flex items-center gap-5 border border-primary/20">
            <div className="w-[80px] h-[72px] rounded-xl bg-background flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">📚</span>
            </div>
            <div className="flex-1">
              <h2 className="text-[17px] font-extrabold text-foreground leading-tight mb-1">
                Mental Health Library
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Expert articles on mental health, therapy, and well-being.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-4 py-4 space-y-5 pb-20 max-w-4xl mx-auto w-full">
        {/* Category filter */}
        {!isLoading && categories.length > 0 && (
          <CategoryFilter
            categories={['All', ...categories]}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
        )}

        {isLoading ? (
          <div className="space-y-5">
            <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: '16/9' }} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-4xl">📰</span>
            <p className="text-muted-foreground">
              {debouncedSearch
                ? `No articles matching "${debouncedSearch}"`
                : `No articles in "${formatCategory(selectedCategory)}"`}
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearch('');
                setSelectedCategory('All');
              }}
              className="text-primary"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {/* Featured hero card */}
            {featuredResource && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-[17px]">Featured</h3>
                  <span className="text-[13px] text-muted-foreground">{totalCount} articles</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/wellness/resources/${featuredResource.slug}`)}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') &&
                    router.push(`/wellness/resources/${featuredResource.slug}`)
                  }
                  className="relative w-full rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
                  style={{ aspectRatio: '16/9' }}
                  aria-label={`Read: ${featuredResource.title}`}
                >
                  {getStrapiImageUrl(
                    featuredResource.coverImage?.webImage?.url ??
                      featuredResource.coverImage?.mobileImage?.url
                  ) ? (
                    <Image
                      src={
                        getStrapiImageUrl(
                          featuredResource.coverImage?.webImage?.url ??
                            featuredResource.coverImage?.mobileImage?.url
                        )!
                      }
                      alt={featuredResource.title ?? 'Featured article'}
                      fill
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-5xl">📰</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {Array.isArray(featuredResource.category) &&
                    (featuredResource.category as string[]).length > 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="text-[11px] bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-bold">
                          {formatCategory((featuredResource.category as string[])[0])}
                        </span>
                      </div>
                    )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-extrabold text-lg leading-tight line-clamp-2 drop-shadow">
                      {featuredResource.title}
                    </p>
                    {(featuredResource as ResourceWithReadTime).averageReadTime && (
                      <div className="flex items-center gap-1 mt-1 text-white/70 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{(featuredResource as ResourceWithReadTime).averageReadTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-white/80 text-xs font-semibold">
                      Read article <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Article grid */}
            {gridResources.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground text-[17px]">
                  {selectedCategory === 'All' ? 'All Articles' : formatCategory(selectedCategory)}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {gridResources.map((resource, i) => (
                    <ArticleCard
                      key={`${resource.id}-${i}`}
                      resource={resource}
                      priority={i < 4}
                      onClick={() => router.push(`/wellness/resources/${resource.slug}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Infinite scroll sentinel + loading indicator */}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading more…
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
