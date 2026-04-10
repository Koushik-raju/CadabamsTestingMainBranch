'use client';

import useSWR from 'swr';
import { getAppointments, getAppointmentsPrevious } from '@/sdk/auth-and-crm';
import { appointmentsKey } from '@/lib/swr-keys';
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

interface UseAppointmentsResult {
  upcoming: AppointmentDetail[];
  past: AppointmentDetail[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useAppointments(): UseAppointmentsResult {
  const { data, error, isLoading } = useSWR(
    appointmentsKey(),
    async () => {
      const [upRes, pastRes] = await Promise.all([
        getAppointments({ query: { start_datetime: new Date().toISOString() } }),
        getAppointmentsPrevious(),
      ]);
      if (upRes.error || pastRes.error) {
        throw new Error(JSON.stringify(upRes.error || pastRes.error));
      }
      return {
        upcoming: upRes.data ?? [],
        past: pastRes.data ?? [],
      };
    }
  );

  return {
    upcoming: data?.upcoming ?? [],
    past: data?.past ?? [],
    isLoading,
    error,
  };
}
