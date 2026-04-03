'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BackButton } from '@/components/common/back-button';
import { VideoPlayer } from '@/components/wellness/video-player';
import { CategoryFilter } from '@/components/wellness/category-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface VideoItem {
  id: number;
  documentId?: string;
  slug: string;
  title: string;
  category?: string[];
  coverImage?: {
    webImage?: { url?: string };
    mobileImage?: { url?: string };
  };
  videoUrl?: string;
  text?: unknown[];
}

function getImageUrl(coverImage?: VideoItem['coverImage']): string {
  const url = coverImage?.webImage?.url ?? coverImage?.mobileImage?.url;
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url.split('?')[0];
  return `https://admin.mindtalkbuddy.com${url}`.split('?')[0];
}

export default function VideoPage() {
  const searchParams = useSearchParams();
  const directUrl = searchParams?.get('url');
  const directTitle = searchParams?.get('title');

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // If ?url= is provided, show direct video player
  useEffect(() => {
    if (directUrl) {
      setIsLoading(false);
      return;
    }

    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          'https://mindtalkbuddy.com/api/videos?pLevel&filters[type][$eq]=Collection%20Video',
          { headers: { 'Content-Type': 'application/json' } }
        );
        const { data } = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid data format');

        const catSet = new Set<string>();
        const sanitized: VideoItem[] = data.map((v: VideoItem) => {
          const cats = Array.isArray(v.category) ? v.category : [];
          cats.forEach((c) => catSet.add(c));
          return { ...v, category: cats };
        });
        setVideos(sanitized);
        setCategories(Array.from(catSet));
      } catch (err) {
        console.error(err);
        setError('Failed to fetch videos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, [directUrl]);

  // Direct video mode: just show the player
  if (directUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <BackButton fallback="/home" />
          {directTitle && (
            <h1 className="font-bold text-foreground text-base truncate">{directTitle}</h1>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <VideoPlayer
              src={directUrl}
              title={directTitle ?? 'Video'}
            />
          </div>
        </div>
      </div>
    );
  }

  const filteredVideos = videos.filter((v) => {
    if (!selectedCategory) return true;
    return (v.category ?? []).some(
      (c) => c.toLowerCase() === selectedCategory.toLowerCase()
    );
  });

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat === selectedCategory ? '' : cat);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-transparent" />
        <div className="relative z-10 px-4 pt-4 pb-8 flex items-center gap-3">
          <BackButton fallback="/home" />
          <h1 className="text-xl font-bold text-foreground">Videos</h1>
        </div>
      </div>

      <main className="flex-1 px-4 py-6 space-y-5">
        {/* Category filter */}
        {categories.length > 0 && (
          <CategoryFilter
            categories={['All', ...categories]}
            selected={selectedCategory || 'All'}
            onSelect={(cat) => handleCategoryClick(cat === 'All' ? '' : cat)}
          />
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border">
                <Skeleton className="h-[200px] w-full" />
                <div className="p-4">
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex justify-center py-16">
            <p className="text-muted-foreground">No videos found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video, index) => {
              const imgUrl = getImageUrl(video.coverImage);
              return (
                <div
                  key={video.id ?? index}
                  onClick={() => video.videoUrl && window.location.assign(`/video?url=${encodeURIComponent(video.videoUrl)}&title=${encodeURIComponent(video.title)}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') video.videoUrl && window.location.assign(`/video?url=${encodeURIComponent(video.videoUrl)}&title=${encodeURIComponent(video.title)}`); }}
                  className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200 shadow-sm"
                  aria-label={`Play video: ${video.title}`}
                >
                  <div className="relative h-[200px] overflow-hidden bg-muted">
                    {imgUrl !== '/placeholder.png' ? (
                      <Image
                        src={imgUrl}
                        alt={video.title}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-4xl">🎬</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-3 right-3 bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-foreground text-sm leading-relaxed line-clamp-2">
                      {video.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
