'use client';

import useSWR from 'swr';
import { crmFetcher } from '@/lib/fetcher';
import { endpoints } from '@/config/api-endpoints';

export function useDoctors(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return useSWR(`${endpoints.GET_DOCTOR_LIST}${query}`, crmFetcher);
}
