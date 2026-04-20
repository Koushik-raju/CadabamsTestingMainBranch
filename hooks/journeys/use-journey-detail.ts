/**
 * FILE: hooks/journeys/use-journey-detail.ts
 *
 * PURPOSE:
 *   SWR hooks and action helpers for a single journey's CMS content, the
 *   user's enrollment record, the list of all enrollments, and gamification.
 *   All business logic (unlock timing, streaks, XP) lives on the server —
 *   this file just wraps SDK calls and manages SWR cache.
 *
 * LOGIC OVERVIEW:
 *   useJourneyDetail(id)     — fetches CMS journey structure
 *   useJourneyProgress(id)   — returns the raw PatientJourneyResponseDto; GET
 *                              auto-enrolls free journeys server-side
 *   useEnrolledJourneys()    — lists all PatientJourneyResponseDto for the user
 *   useGamification()        — fetches GamificationDto (streak, xp, …)
 *   subscribeToJourney()     — POST enroll (only needed for premium journeys)
 *   tickJourney()            — POST tick; server idempotently advances the day
 *   updateNodeProgress()     — POST complete-task; server returns the full
 *                              enrollment which replaces the SWR cache 1:1
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyProgress          — alias for PatientJourneyResponseDto
 *   CAMPUS                   — hard-coded campus slug
 *
 * DEPENDENCIES:
 *   cmsJourneysControllerGetById
 *   journeysControllerListMine / GetByJourneyId / Enroll
 *   journeysControllerCompleteTask / Tick
 *   journeysControllerGetMyGamification
 *   SWR (useSWR, globalMutate)
 *
 * LAST UPDATED: 2026-04-20 — migrate to server-owned journey API (tick, plain taskId, gamification endpoint)
 */
import useSWR, { mutate as globalMutate } from 'swr';
import {
  cmsJourneysControllerGetById,
  journeysControllerEnroll,
  journeysControllerGetByJourneyId,
  journeysControllerCompleteTask,
  journeysControllerTick,
  journeysControllerListMine,
  journeysControllerGetMyGamification,
} from '@/sdk/backend-v2';
import type {
  PatientJourneyResponseDto,
  GamificationDto,
} from '@/sdk/backend-v2';
import {
  journeyDetailKey,
  journeyEnrollmentKey,
  enrolledJourneysKey,
  gamificationKey,
} from '@/lib/swr-keys';
import { mapV2Journey } from './use-journeys-page';
import type { JourneyItem } from '@/types/journey';

export type JourneyProgress = PatientJourneyResponseDto;

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
        path: { journeyId: journeyId! },
      });
      if (res.error) {
        const status =
          (res as { response?: { status?: number }; status?: number }).response?.status ??
          (res as { status?: number }).status ??
          (res.error as { statusCode?: number; status?: number })?.statusCode ??
          (res.error as { statusCode?: number; status?: number })?.status;
        if (status === 404) return null;
        throw new Error(JSON.stringify(res.error));
      }
      return res.data ?? null;
    },
    { revalidateOnFocus: false }
  );

  return { progress: data ?? null, isLoading, error };
}

export function useEnrolledJourneys() {
  const { data, isLoading, error } = useSWR(
    enrolledJourneysKey(),
    async () => {
      const res = await journeysControllerListMine();
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data?.items ?? [];
    },
    { revalidateOnFocus: false }
  );
  return { enrollments: data ?? [], isLoading, error };
}

export function useGamification() {
  const { data, isLoading, error } = useSWR<GamificationDto | null>(
    gamificationKey(),
    async () => {
      const res = await journeysControllerGetMyGamification();
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? null;
    },
    { revalidateOnFocus: false }
  );
  return { gamification: data ?? null, isLoading, error };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function replaceCache(journeyId: string, enrollment: PatientJourneyResponseDto) {
  await globalMutate(journeyEnrollmentKey(journeyId), enrollment, { revalidate: false });
  // Enrollment list and gamification may have changed — refresh in background.
  globalMutate(enrolledJourneysKey());
  globalMutate(gamificationKey());
}

/** Enroll in a premium/paid journey. Free journeys auto-enroll via GET. */
export async function subscribeToJourney(journey: JourneyItem): Promise<void> {
  const res = await journeysControllerEnroll({
    body: { journeyId: journey.id },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (res.data) await replaceCache(journey.id, res.data);
  else await globalMutate(journeyEnrollmentKey(journey.id));
}

/** Idempotent server-driven day advance. Safe to call on mount / focus. */
export async function tickJourney(enrollmentId: string, journeyId: string): Promise<void> {
  const res = await journeysControllerTick({
    path: { id: enrollmentId },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (res.data) await replaceCache(journeyId, res.data);
}

/** Mark a task done. `taskId` is the plain CmsJourneyStepTask.id (not composite). */
export async function updateNodeProgress(
  enrollmentId: string,
  journeyId: string,
  taskId: string
): Promise<void> {
  const res = await journeysControllerCompleteTask({
    path: { id: enrollmentId },
    body: { taskId },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (res.data?.enrollment) await replaceCache(journeyId, res.data.enrollment);
}
