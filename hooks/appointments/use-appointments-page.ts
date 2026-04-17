'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  crmControllerFetchAppointmentDetails,
  crmControllerCancelAppointment,
  type SlotDetailDto,
} from '@/sdk/backend-v2';
import { useAuth } from '@/hooks/shared/auth/use-auth';

export type { SlotDetailDto };

const ONE_YEAR_AGO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

function isUpcoming(apt: SlotDetailDto): boolean {
  const status = apt.availability?.toLowerCase();
  if (status === 'cancelled' || status === 'completed') return false;
  return new Date(apt.start_datetime) >= new Date();
}

export function useAppointments() {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;

  const [all, setAll] = useState<SlotDetailDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmControllerFetchAppointmentDetails({
        query: { leadId, startDatetime: ONE_YEAR_AGO },
      });
      setAll(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load appointments'));
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    upcoming: all.filter(isUpcoming).sort(
      (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    ),
    past: all.filter((a) => !isUpcoming(a)).sort(
      (a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()
    ),
    isLoading,
    error,
    refetch: fetch,
  };
}

export function useAppointmentById(id: number | null) {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;

  const [appointment, setAppointment] = useState<SlotDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!leadId || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmControllerFetchAppointmentDetails({
        query: { leadId, startDatetime: ONE_YEAR_AGO },
      });
      setAppointment((res.data ?? []).find((a) => a.id === id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load appointment'));
    } finally {
      setIsLoading(false);
    }
  }, [leadId, id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { appointment, isLoading, error, refetch: fetch };
}

export async function cancelAppointment(appointmentId: number, reason: string): Promise<void> {
  await crmControllerCancelAppointment({
    body: { appointment_id: appointmentId, medium_id: 5, cancel_reason: reason },
  });
}
