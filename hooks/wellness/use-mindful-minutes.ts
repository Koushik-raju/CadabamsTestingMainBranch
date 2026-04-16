/**
 * FILE: hooks/wellness/use-mindful-minutes.ts
 *
 * PURPOSE:
 *   SWR hook for fetching the full list of mindful minute collections from the CMS.
 *   Each item is a collection (with a slug and optional audios array), not a single track.
 *
 * LOGIC OVERVIEW:
 *   1. Calls cmsMindfulMinutesControllerFindAll with status=PUBLISHED, limit=200.
 *   2. Maps SDK DTOs to internal MindfulMinute / MindfulMinuteAudio types.
 *   3. Derives a unique category list (prefixed with "All") for the filter strip.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   MindfulMinuteAudio   — mapped audio item; note: AudioResponseDto has no duration/category
 *   MindfulMinute        — mapped collection item with slug, title, category, audios[]
 *   useMindfulMinutes()  — returns { items, categories, pagination, isLoading, error, mutate }
 *
 * DEPENDENCIES:
 *   cmsMindfulMinutesControllerFindAll — SDK CMS endpoint
 *   SWR — data fetching
 *
 * LAST UPDATED: 2026-04-16 — removed duration/category from MindfulMinuteAudio (SDK gap),
 *               added createdAt for sorting
 */

'use client';

import useSWR from 'swr';
import { cmsMindfulMinutesControllerFindAll } from '@/sdk/backend-v2';
import type { MindfulMinuteResponseDto, AudioResponseDto } from '@/sdk/backend-v2';
import { mindfulMinutesKey } from '@/lib/swr-keys';

// NOTE: AudioResponseDto has no `duration` or `category` fields (SDK gap).
// Those fields have been removed from this type. Use createdAt for ordering.
export type MindfulMinuteAudio = {
  id: string;
  documentId?: string;
  title: string;
  audioUrl?: string;
  backgroundVisualUrl?: string;
  createdAt: string;
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
    createdAt: a.createdAt,
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
