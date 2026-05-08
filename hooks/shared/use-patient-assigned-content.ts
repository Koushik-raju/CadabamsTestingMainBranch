/**
 * Shared SWR for GET /api/v1/{campus}/patient/assigned-content.
 * One cache entry per lead so assessments + journeys do not double-fetch.
 */
"use client";

import useSWR from "swr";
import { patientAssignedContentKey } from "@/lib/swr-keys";
import { patientAssignedContentControllerListAssigned } from "@/sdk/backend-v2";

export type AssignedContentRoot = {
  crmLeadId?: number | string;
  campus?: string | null;
  items?: unknown[];
  buckets?: Record<string, unknown[]>;
};

export function usePatientAssignedContent(leadId: string | null) {
  return useSWR<AssignedContentRoot | undefined>(
    leadId ? patientAssignedContentKey(leadId) : null,
    async () => {
      const res = await patientAssignedContentControllerListAssigned({
        path: { campus: "cadabams" },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data as AssignedContentRoot | undefined;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
    },
  );
}
