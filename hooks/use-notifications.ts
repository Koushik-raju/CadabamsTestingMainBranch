'use client';

import useSWR from 'swr';
import { crmFetcher } from '@/lib/fetcher';
import { endpoints } from '@/config/api-endpoints';
import { useAuth } from './use-auth';

export function useNotifications() {
  const { user } = useAuth();
  const key = user?.lead_id
    ? `${endpoints.GET_NOTIFICATION_DETAILS}?lead_id=${user.lead_id}`
    : null;
  return useSWR(key, crmFetcher);
}
