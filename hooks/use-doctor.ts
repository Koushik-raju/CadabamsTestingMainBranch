import useSWR from 'swr';
import { getDoctorsById } from '@/sdk/auth-and-crm';
import { doctorKey } from '@/lib/swr-keys';
import type { DoctorDetail } from '@/sdk/auth-and-crm';

interface UseDoctorResult {
  doctor: DoctorDetail | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export function useDoctor(id: number | string | null): UseDoctorResult {
  const shouldFetch = id !== null && id !== undefined;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? doctorKey(id) : null,
    () =>
      getDoctorsById({ path: { id: Number(id) } }).then((res) => {
        if (res.error) throw new Error(JSON.stringify(res.error));
        return res.data;
      })
  );

  return {
    doctor: data,
    isLoading,
    error,
  };
}
