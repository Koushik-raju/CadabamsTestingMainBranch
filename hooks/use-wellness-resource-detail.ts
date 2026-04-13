'use client';

import useSWR from 'swr';
import { fetchWellnessResourceBySlug } from '@/lib/strapi-fetcher';
import { wellnessResourceDetailKey } from '@/lib/swr-keys';

export function useWellnessResourceDetail(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? wellnessResourceDetailKey(slug) : null,
    () => fetchWellnessResourceBySlug(slug),
    { revalidateOnFocus: false }
  );

  return {
    resource: data ?? null,
    isLoading,
    error,
  };
}
