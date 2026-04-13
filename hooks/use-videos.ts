'use client';

import useSWR from 'swr';
import { fetchVideos } from '@/lib/strapi-fetcher';
import { videosKey } from '@/lib/swr-keys';
import type { VideoItem } from '@/types/wellness';

function buildCategories(videos: VideoItem[]): string[] {
  const set = new Set<string>();
  videos.forEach((v) => {
    const cats = Array.isArray(v.category) ? v.category : [];
    cats.forEach((c) => set.add(c));
  });
  return Array.from(set);
}

export function useVideos() {
  const { data, error, isLoading, mutate } = useSWR(
    videosKey(),
    fetchVideos,
    { revalidateOnFocus: false }
  );

  return {
    videos: data ?? [],
    categories: buildCategories(data ?? []),
    isLoading,
    error,
    mutate,
  };
}
