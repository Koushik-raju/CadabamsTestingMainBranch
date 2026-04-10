import useSWR from 'swr';
import { getDoctorsByIdAvailability } from '@/sdk/auth-and-crm';
import { doctorAvailabilityKey } from '@/lib/swr-keys';
import type { DoctorAvailabilityResponse } from '@/sdk/auth-and-crm';

interface UseDoctorAvailabilityResult {
  availability: DoctorAvailabilityResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export function useDoctorAvailability(
  id: number | string | null
): UseDoctorAvailabilityResult {
  const { data, error, isLoading } = useSWR(
    id !== null ? doctorAvailabilityKey(id) : null,
    () =>
      getDoctorsByIdAvailability({ path: { id: Number(id) } }).then((res) => {
        if (res.error) throw new Error(JSON.stringify(res.error));
        return res.data;
      })
  );

  return {
    availability: data,
    isLoading,
    error,
  };
}
