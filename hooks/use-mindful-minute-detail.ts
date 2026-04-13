'use client';

import useSWR from 'swr';
import { getApiV1MindfulMinutesSlugBySlug } from '@/sdk/strapi';
import { mindfulMinuteDetailKey } from '@/lib/swr-keys';
import type { MindfulMinute, MindfulMinuteDetailResponse } from '@/types/wellness';

export function useMindfulMinuteDetail(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? mindfulMinuteDetailKey(slug) : null,
    async () => {
      const res = await getApiV1MindfulMinutesSlugBySlug({ path: { slug } });
      const detail = (res.data as MindfulMinuteDetailResponse)?.data;
      if (!detail) throw new Error('Mindful minute not found');
      return detail as MindfulMinute;
    },
    { revalidateOnFocus: false }
  );

  return {
    mindfulMinute: data ?? null,
    isLoading,
    error,
  };
}
