'use client';

import useSWR from 'swr';
import { cmsMindfulMinutesControllerFindBySlug } from '@/sdk/backend-v2';
import { mindfulMinuteDetailKey } from '@/lib/swr-keys';
import type { MindfulMinute } from './use-mindful-minutes';
export type { MindfulMinute };

export function useMindfulMinuteDetail(slugOrId: string) {
  const { data, error, isLoading } = useSWR(
    slugOrId ? mindfulMinuteDetailKey(slugOrId) : null,
    async () => {
      const res = await cmsMindfulMinutesControllerFindBySlug({ path: { slug: slugOrId } });
      if (!res.data) throw new Error('not_found');
      const dto = res.data;
      return {
        id: dto.id,
        slug: dto.slug,
        title: dto.title,
        category: dto.category,
        coverImageUrl: typeof dto.coverImageUrl === 'string' ? dto.coverImageUrl : undefined,
        audios: dto.audios?.map((a) => ({
          id: a.id,
          documentId: typeof a.documentId === 'string' ? a.documentId : undefined,
          title: a.title,
          audioUrl: typeof a.audioUrl === 'string' ? a.audioUrl : undefined,
          backgroundVisualUrl: typeof a.backgroundVisualUrl === 'string' ? a.backgroundVisualUrl : undefined,
        })),
      } as MindfulMinute;
    },
    { revalidateOnFocus: false }
  );

  return {
    mindfulMinute: data ?? null,
    isLoading,
    error,
  };
}
