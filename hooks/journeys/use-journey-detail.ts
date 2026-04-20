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
 * LAST UPDATED: 2026-04-20 — derive JourneyProgress.lastUpdated from newest task.completedAt (enrollment.lastUpdated is often null)
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
  const tasks = dto.tasks ?? [];
  // Derive lastUpdated from the newest task.completedAt so cooldown/stale logic
  // works even when the enrollment DTO doesn't populate its own lastUpdated field.
  const latestTaskCompletedAt = tasks.reduce<string | null>((latest, t) => {
    if (!t.completedAt) return latest;
    if (!latest || new Date(t.completedAt).getTime() > new Date(latest).getTime()) return t.completedAt;
    return latest;
  }, null);
  // Prefer the newest of (enrollment.lastUpdated, enrollment.lastCompletedDate,
  // max(task.completedAt), enrollment.updatedAt). If we always chose task.completedAt,
  // an enrollment that advanced days but completed no new tasks would stay "stale"
  // forever and re-fire the 24h auto-advance on every mount — that's how we ended
  // up with currentDay values like 11 and 91.
  const candidates: Array<string | null | undefined> = [
    dto.lastUpdated,
    dto.lastCompletedDate,
    latestTaskCompletedAt,
    dto.updatedAt,
  ];
  const newestCandidate = candidates.reduce<string | null>((acc, c) => {
    if (!c) return acc;
    if (!acc || new Date(c).getTime() > new Date(acc).getTime()) return c;
    return acc;
  }, null);
  const lastUpdated = newestCandidate ?? new Date().toISOString();
  console.log('[use-journey-detail] mapEnrollment', {
    journeyId: dto.journeyId,
    enrollmentId: dto.id,
    dto_currentDay: dto.currentDay,
    dto_lastUpdated: dto.lastUpdated,
    dto_lastCompletedDate: dto.lastCompletedDate,
    dto_updatedAt: dto.updatedAt,
    task_count: tasks.length,
    task_taskIds: tasks.map(t => t.taskId),
    task_completedAts: tasks.map(t => t.completedAt),
    derived_latestTaskCompletedAt: latestTaskCompletedAt,
    derived_lastUpdated: lastUpdated,
  });
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
    completedNodeIds: tasks.map((t) => t.taskId),
    startDate: dto.startDate ?? new Date().toISOString(),
    lastUpdated,
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
  console.log('[advanceCurrentDay] start', { journeyId });
  const key = journeyEnrollmentKey(journeyId);
  const completedAt = new Date().toISOString();

  const res = await journeysControllerGetByJourneyId({
    path: { campus: 'cadabams', journeyId },
  });
  if (res.error || !res.data) {
    console.warn('[advanceCurrentDay] pre-fetch failed', { journeyId, error: res.error });
    return;
  }

  const currentDay = res.data.currentDay ?? 1;
  const nextDay = currentDay + 1;
  console.log('[advanceCurrentDay] server state', {
    enrollmentId: res.data.id,
    server_currentDay: currentDay,
    nextDay,
    server_lastUpdated: res.data.lastUpdated,
    server_task_count: res.data.tasks?.length ?? 0,
  });

  // Optimistically bump currentDay so the UI unlocks the next day instantly
  // and doesn't flash back to the previous day during revalidation.
  await globalMutate<JourneyProgress | null>(
    key,
    (current) => {
      const next = current ? { ...current, currentDay: nextDay, lastUpdated: completedAt } : current;
      console.log('[advanceCurrentDay] optimistic cache write', {
        prev_currentDay: current?.currentDay,
        next_currentDay: next?.currentDay,
        prev_lastUpdated: current?.lastUpdated,
        next_lastUpdated: next?.lastUpdated,
      });
      return next;
    },
    { revalidate: false }
  );

  try {
    console.log('[advanceCurrentDay] POST completeDay', { enrollmentId: res.data.id, nextDay, completedAt });
    const postRes = await journeysControllerCompleteDay({
      path: { campus: 'cadabams', id: res.data.id },
      body: { dayNumber: nextDay, completedAt },
    });
    if (postRes.error) throw new Error(JSON.stringify(postRes.error));
    console.log('[advanceCurrentDay] ✓ POST completeDay succeeded', { response: postRes.data });
  } catch (err) {
    console.error('[advanceCurrentDay] ✗ POST completeDay failed — rolling back', err);
    await globalMutate(key); // rollback via revalidation
    throw err;
  }

  console.log('[advanceCurrentDay] background revalidate');
  globalMutate(key);
}

export async function updateNodeProgress(
  _mobile: string,
  journeyId: string,
  nodeId: string,
  _totalNodes: number
): Promise<void> {
  console.log('[updateNodeProgress] start', { journeyId, nodeId });
  const key = journeyEnrollmentKey(journeyId);
  const completedAt = new Date().toISOString();

  // Optimistic update — keeps the node marked done while the server commits,
  // so the UI doesn't flash complete → locked before the revalidate lands.
  await globalMutate<JourneyProgress | null>(
    key,
    (current) => {
      if (!current) {
        console.log('[updateNodeProgress] optimistic skipped — no cached progress');
        return current;
      }
      if (current.completedNodeIds.includes(nodeId)) {
        console.log('[updateNodeProgress] optimistic — nodeId already present, bumping lastUpdated only', {
          nodeId, prev_lastUpdated: current.lastUpdated, next_lastUpdated: completedAt,
        });
        return { ...current, lastUpdated: completedAt };
      }
      const nextIds = [...current.completedNodeIds, nodeId];
      console.log('[updateNodeProgress] optimistic — appending nodeId', {
        nodeId,
        prev_completed_count: current.completedNodeIds.length,
        next_completed_count: nextIds.length,
        prev_lastUpdated: current.lastUpdated,
        next_lastUpdated: completedAt,
      });
      return {
        ...current,
        completedNodeIds: nextIds,
        lastUpdated: completedAt,
      };
    },
    { revalidate: false }
  );

  try {
    const res = await journeysControllerGetByJourneyId({
      path: { campus: 'cadabams', journeyId },
    });
    if (res.error || !res.data) {
      console.warn('[updateNodeProgress] pre-fetch failed', { error: res.error });
      await globalMutate(key);
      return;
    }

    console.log('[updateNodeProgress] POST completeTask', {
      enrollmentId: res.data.id, nodeId, completedAt,
    });
    const postRes = await journeysControllerCompleteTask({
      path: { campus: 'cadabams', id: res.data.id },
      body: { taskId: nodeId, completedAt },
    });
    if (postRes.error) throw new Error(JSON.stringify(postRes.error));
    console.log('[updateNodeProgress] ✓ POST completeTask succeeded', { nodeId, response: postRes.data });
  } catch (err) {
    console.error('[updateNodeProgress] ✗ POST completeTask failed — rolling back', { nodeId, err });
    await globalMutate(key);
    throw err;
  }

  console.log('[updateNodeProgress] background revalidate', { nodeId });
  globalMutate(key);
}
