'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Play, Eye } from 'lucide-react';
import { BackButton } from '@/components/shared/navigation/back-button';
import { CategoryFilter } from '@/components/wellness/category-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MindfulMinute, MindfulMinutesListResponse } from '@/types/wellness';
import { getApiV1MindfulMinutes } from '@/sdk/strapi';

function getImageUrl(coverImageUrl?: string): string {
  if (!coverImageUrl) return '/placeholder.png';
  if (coverImageUrl.startsWith('http')) return coverImageUrl.split('?')[0];
  return `https://admin.mindtalkbuddy.com${coverImageUrl}`.split('?')[0];
}

const BROWSE_BY_NEED = [
  { title: 'Before a meeting', desc: 'Short audios to steady your nerves', icon: '💼' },
  { title: "Can't fall asleep", desc: 'Dark visuals and soft soundscapes', icon: '😴' },
  { title: 'Feeling restless', desc: 'Breath-led calming sequences', icon: '🧘' },
  { title: 'After a tough moment', desc: 'Grounding resets to come back to now', icon: '🫂' },
];

const DEFAULT_CATEGORIES = ['All'];

export default function MindfulMinutesPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<MindfulMinute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'list'>('overview');

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getApiV1MindfulMinutes();
      const { items } = (res.data as MindfulMinutesListResponse).data;
      if (!Array.isArray(items)) throw new Error('Invalid data format');

      const catSet = new Set<string>(DEFAULT_CATEGORIES);
      const sanitized: MindfulMinute[] = items.map((v) => {
        if (v.category) catSet.add(v.category);
        return v;
      });
      setVideos(sanitized);
      const prioritized = [...DEFAULT_CATEGORIES];
      catSet.forEach((c) => { if (!prioritized.includes(c)) prioritized.push(c); });
      setCategories(prioritized);
    } catch (err) {
      console.error(err);
      setError('No mindful minutes available.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchCat = selectedCategory === 'All' || v.category === selectedCategory;
      const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [videos, selectedCategory, searchQuery]);

  const featuredVideo = videos[0];
  const isListView = viewMode === 'list' || selectedCategory !== 'All';

  const handleVideoClick = (slug: string) => {
    router.push(`/mindful-minutes/${slug}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-muted-foreground text-center">{error}</p>
        <button
          onClick={fetchVideos}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <BackButton
            fallback="/home"
            className={isListView ? undefined : undefined}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground text-base">
              {isListView ? 'Audio resets' : 'Quick relief'}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isListView
                ? `${filteredVideos.length} sessions available`
                : 'Breath, audio & visual resets · Under 5…'}
            </p>
          </div>
          {/* Search input */}
          <input
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 px-3 rounded-full border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground w-28 md:w-40 focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Search mindful minutes"
          />
        </div>
      </div>

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
              <p className="text-xs text-muted-foreground/60 mt-1.5 font-semibold">
                Recommended when you feel overwhelmed or tense
              </p>
            </div>
          </div>
        )}

        {/* Category filter */}
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={(cat) => {
            setSelectedCategory(cat);
            if (cat !== 'All') setViewMode('list');
            else setViewMode('overview');
          }}
        />

        {/* Featured */}
        {!isListView && featuredVideo && (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className="font-bold text-foreground text-[17px]">Featured reset</h3>
              <button
                onClick={() => { setViewMode('list'); setSelectedCategory('All'); }}
                className="text-[13px] font-bold text-primary"
              >
                View all audio
              </button>
            </div>
            <div
              onClick={() => handleVideoClick(featuredVideo.slug)}
              className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
            >
              <div className="p-4 flex gap-5">
                <div className="relative w-32 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border/50">
                  <Image
                    src={getImageUrl(featuredVideo.coverImageUrl)}
                    alt={featuredVideo.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-foreground text-[17px] leading-tight">
                      {featuredVideo.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded font-bold uppercase tracking-tight">
                        {'1:30 min'}
                      </span>
                      <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded font-bold uppercase tracking-tight">
                        Audio · Guided
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary font-extrabold text-[14px]">
                    <Play className="w-4 h-4 fill-current" />
                    Play now
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {!isListView && (
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
                      <Skeleton className="h-4 w-14 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVideos
                .slice(viewMode === 'overview' ? 1 : 0)
                .map((video, idx) => (
                  <div
                    key={video.slug}
                    onClick={() => handleVideoClick(video.slug)}
                    className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
                  >
                    <div className="p-3 flex gap-4">
                      <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border/30">
                        <Image
                          src={getImageUrl(video.coverImageUrl)}
                          alt={video.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                        <h4 className="font-extrabold text-foreground text-[14px] leading-tight line-clamp-2">
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold">
                            {'3 min'}
                          </span>
                          <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold">
                            {video.category ?? 'Audio'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-primary font-extrabold text-[13px] mt-1.5">
                          {idx % 3 === 1 ? (
                            <><Eye size={14} /> View</>
                          ) : (
                            <><Play size={13} className="fill-current" /> Play</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Browse by need grid */}
        {!isListView && (
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-foreground text-[17px]">Explore categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {BROWSE_BY_NEED.map((item) => (
                <div
                  key={item.title}
                  onClick={() => { setViewMode('list'); setSelectedCategory('All'); }}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform min-h-[136px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
                    {item.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-foreground text-[15px] leading-tight">{item.title}</h4>
                    <p className="text-muted-foreground text-xs font-semibold leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
