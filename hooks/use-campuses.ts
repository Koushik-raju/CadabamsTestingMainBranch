import useSWR from 'swr';
import { getMastersCampuses } from '@/sdk/auth-and-crm';
import { campusesKey } from '@/lib/swr-keys';
import type { CampusMaster } from '@/sdk/auth-and-crm';

interface UseCampusesResult {
  campuses: CampusMaster[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useCampuses(): UseCampusesResult {
  const { data, error, isLoading } = useSWR(
    campusesKey(),
    () =>
      getMastersCampuses().then((res) => {
        if (res.error) throw new Error(JSON.stringify(res.error));
        return res.data ?? [];
      })
  );

  return {
    campuses: Array.isArray(data) ? data.filter((c: CampusMaster) => c.book_appointment) : [],
    isLoading,
    error,
  };
}
