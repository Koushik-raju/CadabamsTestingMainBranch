/**
 * FILE: hooks/prescriptions/use-prescriptions.ts
 *
 * PURPOSE:
 *   SWR hook for fetching the current patient's prescriptions via the CRM SDK.
 *
 * LOGIC OVERVIEW:
 *   1. Reads the integer lead ID from the auth context (user.lead_id).
 *   2. Calls crmControllerGetPrescriptions with the lead ID as a path param.
 *   3. Flattens PrescriptionGroupDto[] → PrescriptionItemDto[] across all databases.
 *   4. Returns the flat list plus SWR loading/error/mutate state.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   leadId           — integer lead ID from user context (path param)
 *   usePrescriptions — exported hook; returns { prescriptions, isLoading, error, mutate }
 *
 * DEPENDENCIES:
 *   crmControllerGetPrescriptions — SDK call
 *   useAuth                       — provides user.lead_id
 *   SWR                           — data fetching / caching
 *
 * LAST UPDATED: 2026-04-17 — migrate to crmControllerGetPrescriptions + PrescriptionItemDto
 */

"use client";

import useSWR from "swr";
import { crmControllerGetPrescriptions } from "@/sdk/backend-v2";
import type { PrescriptionItemDto } from "@/sdk/backend-v2";
import { useAuth } from "@/hooks/shared/auth/use-auth";

export function usePrescriptions() {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;

  const { data, isLoading, error, mutate } = useSWR(
    leadId ? `/prescriptions/${leadId}` : null,
    async () => {
      const res = await crmControllerGetPrescriptions({
        path: { leadId: leadId! },
      });
      const groups = res.data?.prescriptions ?? [];
      const items: PrescriptionItemDto[] = groups.flatMap((g) => g.data);
      return items;
    },
    { revalidateOnFocus: false },
  );

  return {
    prescriptions: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
