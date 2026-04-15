'use client';

import useSWR from 'swr';
import { fetchVideoBySlug } from '@/lib/strapi-fetcher';
import { videoDetailKey } from '@/lib/swr-keys';
export type { VideoItem } from './use-videos';

export function useVideoDetail(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? videoDetailKey(slug) : null,
    () => fetchVideoBySlug(slug),
    { revalidateOnFocus: false }
  );

  return {
    video: data ?? null,
    isLoading,
    error,
  };
}
