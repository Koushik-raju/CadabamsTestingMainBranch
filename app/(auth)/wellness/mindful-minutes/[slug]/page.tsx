'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Play, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { BackButton } from '@/components/shared/navigation/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useMindfulMinuteDetail } from '@/hooks/use-mindful-minute-detail';
import {
  FullscreenAudioPlayer,
  EqualizerBars,
} from '@/components/wellness/fullscreen-audio-player';
import Link from 'next/link';
import type { MindfulMinuteAudio } from '@/types/wellness';

type SortOrder = 'asc' | 'desc';

function formatDuration(duration?: string): string {
  if (!duration) return '–';
  return duration;
}

export default function MindfulMinuteDetailPage() {
  const params = useParams();
  const slugOrId = typeof params?.slug === 'string' ? params.slug : '';
  const { mindfulMinute, isLoading, error } = useMindfulMinuteDetail(slugOrId);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  const sortedAudios = useMemo((): MindfulMinuteAudio[] => {
    const list = mindfulMinute?.audios ?? [];
    return [...list].sort((a, b) => {
      const da = parseFloat(a.duration ?? '0') || 0;
      const db = parseFloat(b.duration ?? '0') || 0;
      return sortOrder === 'asc' ? da - db : db - da;
    });
  }, [mindfulMinute, sortOrder]);

  const filteredAudios = useMemo(() => {
    if (!searchQuery) return sortedAudios;
    return sortedAudios.filter((a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedAudios, searchQuery]);

  const handleAudioTap = (idx: number) => {
    setActiveIndex(idx);
    setPlayerOpen(true);
  };

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
    const isNotFound = !mindfulMinute || error?.message === 'not_found';
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p className="font-bold text-foreground text-lg">
          {isNotFound ? '404' : 'Something went wrong'}
        </p>
        <p className="text-muted-foreground">
          {isNotFound
            ? 'This mindful minute could not be found.'
            : error?.message}
        </p>
        <Button asChild variant="outline">
          <Link href="/wellness/mindful-minutes">Back to Mindful Minutes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fullscreen player portal */}
      {playerOpen && activeIndex !== null && filteredAudios.length > 0 && (
        <FullscreenAudioPlayer
          audios={filteredAudios}
          initialIndex={activeIndex}
          onClose={() => setPlayerOpen(false)}
          onTrackChange={(idx) => setActiveIndex(idx)}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <BackButton fallback="/wellness/mindful-minutes" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground text-base truncate">{mindfulMinute.title}</h1>
            <p className="text-muted-foreground text-xs">{filteredAudios.length} sessions available</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 rounded-full border-border bg-muted text-sm w-28 md:w-40"
              aria-label="Search audio"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-5 max-w-2xl mx-auto w-full pb-20">
        {/* Sort control */}
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-foreground text-[15px]">All Audio</h3>
          <button
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="text-sm font-bold text-muted-foreground flex items-center gap-1 active:opacity-70"
          >
            {sortOrder === 'asc' ? 'Shortest first' : 'Longest first'}
            {sortOrder === 'asc' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Audio list */}
        <div className="space-y-3">
          {filteredAudios.map((audio, idx) => {
            const isActive = playerOpen && activeIndex === idx;
            return (
              <div
                key={audio.documentId ?? idx}
                onClick={() => handleAudioTap(idx)}
                className="bg-card border border-border rounded-2xl cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
              >
                <div className="p-3.5 flex items-center gap-4">
                  {/* Icon / equalizer */}
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    {isActive ? (
                      <EqualizerBars />
                    ) : (
                      <span className="text-xl">🎵</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-[15px] truncate">
                      {audio.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      {audio.duration && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold">
                          {formatDuration(audio.duration)}
                        </span>
                      )}
                      {audio.category && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold">
                          {audio.category}
                        </span>
                      )}
                      {!audio.duration && !audio.category && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold">
                          Audio
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-primary font-bold text-[13px] mt-2">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isActive ? 'Now playing' : 'Play'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAudios.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No audio sessions found.</p>
          )}
        </div>
      </main>
    </div>
  );
}
