'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Play, RefreshCw } from 'lucide-react';
import { BackButton } from '@/components/shared/navigation/back-button';
import { CategoryFilter } from '@/components/wellness/category-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVideos } from '@/hooks/use-videos';
import { getStrapiImageUrl } from '@/lib/strapi-fetcher';
import type { VideoItem } from '@/types/wellness';

// ─── Video card ───────────────────────────────────────────────────────────────
function VideoCard({
  video,
  onClick,
  featured = false,
}: {
  video: VideoItem;
  onClick: () => void;
  featured?: boolean;
}) {
  const imgUrl =
    getStrapiImageUrl(
      video.coverImage?.webImage?.url ?? video.coverImage?.mobileImage?.url
    ) ?? null;

  if (featured) {
    return (
      <div
        onClick={onClick}
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
        style={{ aspectRatio: '16/9' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        aria-label={`Play: ${video.title}`}
      >
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-5xl">🎬</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-xl">
            <Play className="h-7 w-7 text-primary fill-current ml-1" />
          </div>
        </div>
        {video.category && video.category.length > 0 && (
          <div className="absolute top-3 left-3">
            <span className="text-[11px] bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-bold">
              {video.category[0]}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-extrabold text-lg leading-tight line-clamp-2 drop-shadow">
            {video.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer group hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Play: ${video.title}`}
    >
      <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">🎬</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="h-5 w-5 text-primary fill-current ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
          <Play className="h-3.5 w-3.5 text-white fill-current ml-0.5" />
        </div>
        {video.category && video.category.length > 0 && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded font-bold">
              {video.category[0]}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
          {video.title}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VideoPage() {
  const router = useRouter();
  const { videos, categories, isLoading, error, mutate } = useVideos();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isFiltered = selectedCategory !== 'All' || !!searchQuery;

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchCat =
        selectedCategory === 'All' ||
        (v.category ?? []).some(
          (c) => c.toLowerCase() === selectedCategory.toLowerCase()
        );
      const matchSearch =
        !searchQuery ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [videos, selectedCategory, searchQuery]);

  const featuredVideo = filteredVideos[0];
  const listVideos = filteredVideos.slice(1);

  const navigateTo = (video: VideoItem) => {
    const id = video.slug || String(video.id);
    router.push(`/wellness/video/${id}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-muted-foreground text-center">Failed to load videos.</p>
        <Button onClick={() => mutate()} variant="outline" className="gap-2">
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
              {selectedCategory !== 'All' ? selectedCategory : 'Videos'}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isLoading
                ? 'Loading…'
                : isFiltered
                ? `${filteredVideos.length} videos`
                : `${videos.length} videos available`}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 rounded-full border-border bg-muted text-sm w-28 md:w-40"
              aria-label="Search videos"
            />
          </div>
        </div>
      </div>

      {/* Banner */}
      {!isFiltered && !isLoading && (
        <div className="px-4 pt-4">
          <div className="bg-primary/10 rounded-2xl p-5 flex items-center gap-5 border border-primary/20">
            <div className="w-[80px] h-[72px] rounded-xl bg-background flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">🎬</span>
            </div>
            <div className="flex-1">
              <h2 className="text-[17px] font-extrabold text-foreground leading-tight mb-1">
                Watch &amp; Learn
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Curated videos on mental health, wellness, and self-care.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-4 py-4 space-y-5 pb-20 max-w-4xl mx-auto w-full">
        {/* Category filter from API */}
        {!isLoading && categories.length > 0 && (
          <CategoryFilter
            categories={['All', ...categories]}
            selected={selectedCategory}
            onSelect={(cat) => { setSelectedCategory(cat); setSearchQuery(''); }}
          />
        )}

        {isLoading ? (
          <div className="space-y-5">
            <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: '16/9' }} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border">
                  <Skeleton className="w-full" style={{ aspectRatio: '16/9' }} />
                  <div className="p-3"><Skeleton className="h-4 w-3/4" /></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-4xl">🎬</span>
            <p className="text-muted-foreground">
              {searchQuery ? `No videos matching "${searchQuery}"` : `No videos in "${selectedCategory}"`}
            </p>
            <Button
              variant="ghost"
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="text-primary"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {featuredVideo && (
              <div className="space-y-2">
                {!isFiltered && (
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-[17px]">Featured</h3>
                    <span className="text-[13px] text-muted-foreground">{filteredVideos.length} videos</span>
                  </div>
                )}
                <VideoCard video={featuredVideo} onClick={() => navigateTo(featuredVideo)} featured />
              </div>
            )}

            {listVideos.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground text-[17px]">
                  {selectedCategory === 'All' ? 'All Videos' : selectedCategory}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {listVideos.map((video, i) => (
                    <VideoCard key={video.id ?? i} video={video} onClick={() => navigateTo(video)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
