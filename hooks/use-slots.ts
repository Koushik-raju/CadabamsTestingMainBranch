import useSWR from 'swr';
import { getAppointmentsSlots } from '@/sdk/auth-and-crm';
import { slotsKey } from '@/lib/swr-keys';
import type { TimeSlot } from '@/sdk/auth-and-crm';

interface UseSlotsResult {
  slots: TimeSlot[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useSlots(
  doctorId: number | string | null,
  consultTypeId: number | null
): UseSlotsResult {
  const shouldFetch = doctorId !== null && consultTypeId !== null;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? slotsKey(doctorId, consultTypeId) : null,
    () =>
      getAppointmentsSlots({
        query: {
          doctor_id: Number(doctorId),
          availability: 'open',
          consultation_type_ids: consultTypeId as 1 | 2 | 3,
        },
      }).then((res) => {
        if (res.error) throw new Error(JSON.stringify(res.error));
        return res.data ?? [];
      })
  );

  return {
    slots: Array.isArray(data) ? data : [],
    isLoading,
    error,
  };
}
