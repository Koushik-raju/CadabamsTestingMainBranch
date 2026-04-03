'use client';

import useSWR from 'swr';
import { crmFetcher } from '@/lib/fetcher';
import { endpoints } from '@/config/api-endpoints';

export function usePackages(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return useSWR(`${endpoints.GET_ALL_PACKAGES}${query}`, crmFetcher);
}
