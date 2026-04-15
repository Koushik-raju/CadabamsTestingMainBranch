import useSWR from 'swr';
import { mastersControllerGetCampuses } from '@/sdk/backend-v2';
import { campusesKey } from '@/lib/swr-keys';

interface UseCampusesResult {
  campuses: Array<{ [key: string]: unknown }>;
  isLoading: boolean;
  error: Error | undefined;
}

export function useCampuses(): UseCampusesResult {
  const { data, error, isLoading } = useSWR(
    campusesKey(),
    async () => {
      const res = await mastersControllerGetCampuses({ path: { campus: 'cadabams' } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const result = res.data;
      return Array.isArray(result) ? result : (result ? [result] : []);
    }
  );

  const campuses = Array.isArray(data) ? data : [];

  return {
    campuses: campuses.filter((c) => (c as { book_appointment?: boolean }).book_appointment),
    isLoading,
    error,
  };
}
