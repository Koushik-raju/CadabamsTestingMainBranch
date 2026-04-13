'use client';

import useSWR from 'swr';
import {
  getApiV1MindfulMinutesById,
  getApiV1MindfulMinutesSlugBySlug,
} from '@/sdk/strapi';
import { mindfulMinuteDetailKey } from '@/lib/swr-keys';
import type { MindfulMinute, MindfulMinuteDetailResponse } from '@/types/wellness';

export function useMindfulMinuteDetail(slugOrId: string) {
  const { data, error, isLoading } = useSWR(
    slugOrId ? mindfulMinuteDetailKey(slugOrId) : null,
    async () => {
      // Try slug first
      try {
        const res = await getApiV1MindfulMinutesSlugBySlug({ path: { slug: slugOrId } });
        const detail = (res.data as MindfulMinuteDetailResponse)?.data;
        if (detail) return detail as MindfulMinute;
      } catch {
        // slug lookup failed, fall through to id lookup
      }

      // Fall back to id lookup
      const res = await getApiV1MindfulMinutesById({ path: { id: slugOrId } });
      const detail = (res.data as MindfulMinuteDetailResponse)?.data;
      if (!detail) throw new Error('not_found');
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
