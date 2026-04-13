'use client';

import useSWR from 'swr';
import { getApiV1MindfulMinutes } from '@/sdk/strapi';
import { mindfulMinutesKey } from '@/lib/swr-keys';
import type { MindfulMinute, MindfulMinutesListResponse } from '@/types/wellness';

async function fetcher() {
  const res = await getApiV1MindfulMinutes();
  const data = (res.data as MindfulMinutesListResponse)?.data;
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

  return {
    items: data?.items ?? [],
    categories: buildCategories(data?.items ?? []),
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    mutate,
  };
}
