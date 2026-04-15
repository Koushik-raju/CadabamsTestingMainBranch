'use client';

import useSWR from 'swr';
import { evaluationsControllerGetPrescriptions } from '@/sdk/backend-v2';
import { useAuth } from '@/hooks/shared/auth/use-auth';
import type { Prescription } from '@/types/package';

const CAMPUS = 'cadabams' as const;

export function usePrescriptions() {
  const { user } = useAuth();
  const leadId = user?.lead_id ? String(user.lead_id) : null;

  const { data, isLoading, error, mutate } = useSWR(
    leadId ? `/prescriptions/${leadId}` : null,
    async () => {
      const domain = `[('partner_id.ref','=','${leadId}')]`;
      const res = await evaluationsControllerGetPrescriptions({
        path: { campus: CAMPUS },
        query: { domain },
      });
      const items = res.data?.items ?? [];
      return items as Prescription[];
    },
    { revalidateOnFocus: false }
  );

  return {
    prescriptions: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
