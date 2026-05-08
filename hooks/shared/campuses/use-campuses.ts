/**
 * FILE: hooks/shared/campuses/use-campuses.ts
 *
 * PURPOSE:
 *   SWR hook around crmControllerGetCampuses. Returns the list of bookable
 *   campuses plus the canonical `defaultCampusId` flagged by the backend
 *   (CampusMasterResponseDto.is_default), so callers never have to encode
 *   "campus 1" as a magic number.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches /api/v1/crm/masters/campuses via SDK.
 *   2. Filters to campuses where book_appointment === true.
 *   3. Picks the campus with is_default === true as defaultCampusId; falls
 *      back to undefined when SWR is still loading or the backend returns
 *      no default flag (treated as a hard error at call sites).
 *
 * KEY VARIABLES / EXPORTS:
 *   useCampuses        — SWR hook returning { campuses, defaultCampusId, isLoading, error }
 *
 * DEPENDENCIES:
 *   crmControllerGetCampuses — SDK function
 *   campusesKey              — from @/lib/swr-keys
 *   CampusMasterResponseDto  — typed SDK DTO
 *
 * LAST UPDATED: 2026-05-08 — Added typed return + defaultCampusId derived from CampusMasterResponseDto.is_default
 */
import useSWR from "swr";
import { campusesKey } from "@/lib/swr-keys";
import type { CampusMasterResponseDto } from "@/sdk/backend-v2";
import { crmControllerGetCampuses } from "@/sdk/backend-v2";

interface UseCampusesResult {
  campuses: CampusMasterResponseDto[];
  defaultCampusId: number | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export function useCampuses(): UseCampusesResult {
  const { data, error, isLoading } = useSWR<CampusMasterResponseDto[]>(campusesKey(), async () => {
    const res = await crmControllerGetCampuses({});
    if (res.error) throw new Error(JSON.stringify(res.error));
    return res.data ?? [];
  });

  const all = data ?? [];
  const campuses = all.filter((c) => c.book_appointment);
  const defaultCampusId = all.find((c) => c.is_default)?.id;

  return { campuses, defaultCampusId, isLoading, error };
}
