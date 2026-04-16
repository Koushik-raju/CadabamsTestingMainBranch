/**
 * FILE: hooks/journeys/use-journey-detail.ts
 *
 * PURPOSE:
 *   SWR hooks and action helpers for individual journey data and enrollment state.
 *   Provides per-journey detail, the user's enrollment/progress record, the full
 *   list of the user's enrolled journeys, and mutation helpers (enroll, advance
 *   day, mark task complete).
 *
 * LOGIC OVERVIEW:
 *   useJourneyDetail(id)     — fetches CMS journey structure via cmsJourneysControllerGetById
 *   useJourneyProgress(id)   — fetches a single enrollment record; 404 → null (not enrolled)
 *   useEnrolledJourneys()    — fetches ALL enrollments for the current user via journeysControllerListMine
 *   subscribeToJourney()     — enrolls the user and invalidates the enrollment cache
 *   advanceCurrentDay()      — marks the current day complete and moves to the next
 *   updateNodeProgress()     — marks a single task node as complete
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyProgress          — mapped enrollment shape consumed by UI components
 *   mapEnrollment(dto)       — converts PatientJourneyResponseDto → JourneyProgress
 *   useEnrolledJourneys()    — returns { enrollments: JourneyProgress[], isLoading, error }
 *
 * DEPENDENCIES:
 *   cmsJourneysControllerGetById    — CMS journey content fetch
 *   journeysControllerListMine      — lists all user enrollments
 *   journeysControllerGetByJourneyId — single enrollment lookup
 *   journeysControllerEnroll        — enroll action
 *   journeysControllerCompleteTask  — mark task done
 *   journeysControllerCompleteDay   — advance to next day
 *   SWR (useSWR, globalMutate)
 *
 * LAST UPDATED: 2026-04-16 — added useEnrolledJourneys for My Journeys section on list page
 */
import useSWR, { mutate as globalMutate } from 'swr';
import {
  cmsJourneysControllerGetById,
  journeysControllerEnroll,
  journeysControllerGetByJourneyId,
  journeysControllerCompleteTask,
  journeysControllerCompleteDay,
  journeysControllerListMine,
} from '@/sdk/backend-v2';
import { journeyDetailKey, journeyEnrollmentKey, enrolledJourneysKey } from '@/lib/swr-keys';
import { mapV2Journey } from './use-journeys-page';
import type { JourneyItem } from '@/types/journey';
import type { PatientJourneyResponseDto } from '@/sdk/backend-v2';

// ---------------------------------------------------------------------------
// Types — kept compatible with existing page/component API
// ---------------------------------------------------------------------------

export interface JourneyProgress {
  enrollmentId: string;
  journeyId: string;
  name: string;
  icon?: string;
  currentDay: number;
  totalDays: number;
  streak: number;
  gems: number;
  isPremium: boolean;
  progress: number;
  completedNodeIds: string[];
  startDate: string;
  lastUpdated: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapEnrollment(dto: PatientJourneyResponseDto): JourneyProgress {
  const gamification = dto.gamification as Record<string, unknown> | null;
  return {
    enrollmentId: dto.id,
    journeyId: dto.journeyId,
    name: dto.name ?? '',
    icon: dto.icon ?? undefined,
    currentDay: dto.currentDay ?? 1,
    totalDays: dto.totalDays ?? 0,
    streak: (gamification?.streak as number) ?? 0,
    gems: (gamification?.gems as number) ?? 0,
    isPremium: false,
    progress: dto.progress ?? 0,
    completedNodeIds: (dto.tasks ?? []).map((t) => t.taskId),
    startDate: dto.startDate ?? new Date().toISOString(),
    lastUpdated: dto.lastUpdated ?? new Date().toISOString(),
    isActive: dto.isActive,
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useJourneyDetail(id: string | null) {
  const key = id ? journeyDetailKey(id) : null;

  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      const res = await cmsJourneysControllerGetById({ path: { id: id! } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ? mapV2Journey(res.data) : null;
    },
    { revalidateOnFocus: false, revalidateIfStale: false }
  );

  return { journey: (data ?? null) as JourneyItem | null, isLoading, error };
}

export function useJourneyProgress(journeyId: string | null) {
  const key = journeyId ? journeyEnrollmentKey(journeyId) : null;

  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      const res = await journeysControllerGetByJourneyId({
        path: { campus: 'cadabams', journeyId: journeyId! },
      });
      if (res.error) {
        // 404 means not enrolled yet — return null (not an error)
        const errObj = res.error as Record<string, unknown>;
        if (errObj?.status === 404 || errObj?.statusCode === 404) return null;
        throw new Error(JSON.stringify(res.error));
      }
      return res.data ? mapEnrollment(res.data) : null;
    },
    { revalidateOnFocus: false }
  );

  return { progress: data ?? null, isLoading, error, mobile: null as string | null };
}

export function useEnrolledJourneys() {
  const { data, isLoading, error } = useSWR(
    enrolledJourneysKey(),
    async () => {
      const res = await journeysControllerListMine({ path: { campus: 'cadabams' } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return (res.data?.items ?? []).map(mapEnrollment);
    },
    { revalidateOnFocus: false }
  );
  return { enrollments: data ?? [], isLoading, error };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Enroll the authenticated user in a journey.
 */
export async function subscribeToJourney(
  _mobile: string,
  journey: JourneyItem
): Promise<void> {
  const res = await journeysControllerEnroll({
    path: { campus: 'cadabams' },
    body: { journeyId: journey.id },
  });

  if (res.error) throw new Error(JSON.stringify(res.error));

  await globalMutate(journeyEnrollmentKey(journey.id));
}

export async function advanceCurrentDay(
  _mobile: string,
  journeyId: string
): Promise<void> {
  // Get enrollment first to find enrollmentId and currentDay
  const res = await journeysControllerGetByJourneyId({
    path: { campus: 'cadabams', journeyId },
  });
  if (res.error || !res.data) return;

  const currentDay = res.data.currentDay ?? 1;

  await journeysControllerCompleteDay({
    path: { campus: 'cadabams', id: res.data.id },
    body: { dayNumber: currentDay + 1, completedAt: new Date().toISOString() },
  });

  await globalMutate(journeyEnrollmentKey(journeyId));
}

export async function updateNodeProgress(
  _mobile: string,
  journeyId: string,
  nodeId: string,
  _totalNodes: number
): Promise<void> {
  // Get enrollment to find enrollmentId
  const res = await journeysControllerGetByJourneyId({
    path: { campus: 'cadabams', journeyId },
  });
  if (res.error || !res.data) return;

  await journeysControllerCompleteTask({
    path: { campus: 'cadabams', id: res.data.id },
    body: { taskId: nodeId, completedAt: new Date().toISOString() },
  });

  await globalMutate(journeyEnrollmentKey(journeyId));
}
