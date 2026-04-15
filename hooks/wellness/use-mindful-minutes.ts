'use client';

import useSWR from 'swr';
import { cmsMindfulMinutesControllerFindAll } from '@/sdk/backend-v2';
import type { MindfulMinuteResponseDto, AudioResponseDto } from '@/sdk/backend-v2';
import { mindfulMinutesKey } from '@/lib/swr-keys';

export type MindfulMinuteAudio = {
  id: string;
  documentId?: string;
  title: string;
  audioUrl?: string;
  backgroundVisualUrl?: string;
  duration?: string;
  category?: string;
};

export type MindfulMinute = {
  id: string;
  documentId?: string;
  slug: string;
  title: string;
  category?: string;
  coverImageUrl?: string;
  audios?: MindfulMinuteAudio[];
};

function mapAudio(a: AudioResponseDto): MindfulMinuteAudio {
  return {
    id: a.id,
    documentId: typeof a.documentId === 'string' ? a.documentId : undefined,
    title: a.title,
    audioUrl: typeof a.audioUrl === 'string' ? a.audioUrl : undefined,
    backgroundVisualUrl: typeof a.backgroundVisualUrl === 'string' ? a.backgroundVisualUrl : undefined,
  };
}

function mapMindfulMinute(dto: MindfulMinuteResponseDto): MindfulMinute {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    category: dto.category,
    coverImageUrl: typeof dto.coverImageUrl === 'string' ? dto.coverImageUrl : undefined,
    audios: dto.audios?.map(mapAudio),
  };
}

async function fetcher() {
  const res = await cmsMindfulMinutesControllerFindAll({
    query: { status: 'PUBLISHED', limit: 200 },
  });
  const data = res.data;
  if (!data || !Array.isArray(data.items)) throw new Error('Invalid data format');
  return data;
}

function buildCategories(items: MindfulMinute[]): string[] {
  const set = new Set<string>(['All']);
  items.forEach((v) => { if (v.category) set.add(v.category); });
  return Array.from(set);
}

export function useMindfulMinutes() {
  const { data, error, isLoading, mutate } = useSWR(
    mindfulMinutesKey(),
    fetcher,
    { revalidateOnFocus: false }
  );

  const items = data?.items?.map(mapMindfulMinute) ?? [];

  return {
    items,
    categories: buildCategories(items),
    pagination: data ? { total: data.total ?? 0, limit: data.limit ?? 200, offset: data.offset ?? 0 } : null,
    isLoading,
    error,
    mutate,
  };
}
