'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, ChevronRight } from 'lucide-react';
import { BackButton } from '@/components/common/back-button';
import { CategoryFilter } from '@/components/wellness/category-filter';
import { AudioPlayer } from '@/components/wellness/audio-player';
import { Skeleton } from '@/components/ui/skeleton';
import type { MindfulMinute, MindfulMinuteAudio } from '@/types/wellness';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const DEFAULT_CATS = ['All', 'Sleep', 'Anxiety', 'Focus', 'Short'];

export default function MindfulMinuteDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const router = useRouter();

  const [mindfulMinute, setMindfulMinute] = useState<MindfulMinute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAudio, setActiveAudio] = useState<MindfulMinuteAudio | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetch_ = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://mindtalkbuddy.com/api/mindful-minutes?filters[slug][$eq]=${slug}&populate=*`
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const { data } = await res.json();
        if (data && data.length > 0) {
          setMindfulMinute(data[0] as MindfulMinute);
        } else {
          setError('Mindful minute not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch_();
  }, [slug]);

  const audios = useMemo(() => {
    let list = mindfulMinute?.audio ?? [];
    if (searchQuery) {
      list = list.filter((a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== 'All') {
      list = list.filter((a) => {
        const cats = Array.isArray(a.category) ? a.category : a.category ? [a.category] : [];
        return cats.includes(selectedCategory);
      });
    }
    return list;
  }, [mindfulMinute, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set<string>(DEFAULT_CATS);
    (mindfulMinute?.audio ?? []).forEach((a) => {
      if (Array.isArray(a.category)) a.category.forEach((c) => cats.add(c));
      else if (a.category) cats.add(a.category as string);
    });
    return Array.from(cats);
  }, [mindfulMinute]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-3 border border-border rounded-2xl">
              <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !mindfulMinute) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p className="text-muted-foreground">{error ?? 'Not found'}</p>
        <Button asChild variant="outline">
          <Link href="/mindful-minutes">Back to Mindful Minutes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <BackButton fallback="/mindful-minutes" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground text-base">Audio resets</h1>
            <p className="text-muted-foreground text-xs">{audios.length} sessions available</p>
          </div>
          <input
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 px-3 rounded-full border border-border bg-muted text-sm w-28 md:w-40 focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Search audio"
          />
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-5 max-w-2xl mx-auto w-full pb-20">
        {/* Category filter */}
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="flex justify-between items-center">
          <h3 className="font-bold text-foreground text-[15px]">All Audio</h3>
          <button className="text-sm font-bold text-muted-foreground flex items-center gap-1">
            Shortest first
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
        </div>

        {/* Audio list */}
        <div className="space-y-3">
          {audios.map((audio, idx) => (
            <div key={audio.documentId ?? idx}>
              <div
                onClick={() => setActiveAudio(activeAudio?.documentId === audio.documentId ? null : audio)}
                className="bg-card border border-border rounded-2xl cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
              >
                <div className="p-3.5 flex items-center gap-4">
                  {/* Icon */}
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                    <span className="text-xl">🎵</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-[15px] truncate group-hover:text-primary transition-colors">
                      {audio.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold">
                        {audio.duration ?? (idx % 2 === 0 ? '3 min' : '5 min')}
                      </span>
                      <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold">
                        Audio
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary font-bold text-[13px] mt-2">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {activeAudio?.documentId === audio.documentId ? 'Now playing' : 'Play'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inline audio player */}
              {activeAudio?.documentId === audio.documentId && audio.audio?.url && (
                <div className="mt-2">
                  <AudioPlayer
                    src={audio.audio.url}
                    title={audio.title}
                    autoPlay
                  />
                </div>
              )}
            </div>
          ))}

          {audios.length === 0 && (
            <p className="text-muted-foreground text-center py-12">
              No audio sessions found.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
