import useSWR, { mutate as globalMutate } from 'swr';
import {
  cmsJourneysControllerGetById,
  journeysControllerGetByJourneyId,
  journeysControllerCompleteTask,
  journeysControllerCompleteDay,
} from '@/sdk/backend-v2';
import { journeyDetailKey, journeyEnrollmentKey } from '@/lib/swr-keys';
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

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Subscribe / enroll user in a journey.
 * NOTE: There is no create-enrollment endpoint in backend-v2 SDK as of this migration.
 * This function completes day 1 to trigger implicit enrollment on the backend.
 * Until a dedicated enroll endpoint is available, this is a best-effort approach.
 */
export async function subscribeToJourney(
  _mobile: string,
  journey: JourneyItem
): Promise<void> {
  // Trigger completeDay for day 1 — backend will create enrollment on first completion
  await journeysControllerCompleteDay({
    path: { campus: 'cadabams', id: journey.id },
    body: { dayNumber: 1, completedAt: new Date().toISOString() },
  });

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
