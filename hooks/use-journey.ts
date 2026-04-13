import useSWR, { mutate as globalMutate } from 'swr';
import { getApiV1Journeys, getApiV1JourneysById } from '@/sdk/strapi';
import { swrConfig } from '@/lib/swr-config';
import { journeysKey, journeyDetailKey, journeyProgressKey } from '@/lib/swr-keys';
import { useAuth } from '@/hooks/use-auth';
import type { JourneyItem, JourneysListResponse, JourneyDetailResponse } from '@/types/journey';
import { extractJourneyName } from '@/types/journey';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JourneyProgress {
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMobileFromUser(user: Record<string, unknown> | null | undefined): string | null {
  if (!user) return null;
  const mobile = user.caller_mobile as string | undefined;
  if (!mobile) return null;
  return mobile.replace(/\D/g, '');
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchJourneyList(options?: {
  limit?: number;
  search?: string;
}): Promise<JourneyItem[]> {
  const res = await getApiV1Journeys({
    query: {
      limit: options?.limit ?? 50,
      status: 'PUBLISHED',
      ...(options?.search ? { search: options.search } : {}),
    } as never,
  });
  const data = res.data as JourneysListResponse | undefined;
  return data?.data?.items ?? [];
}

async function fetchJourneyDetail(id: string): Promise<JourneyItem | null> {
  const res = await getApiV1JourneysById({ path: { id } });
  const data = res.data as JourneyDetailResponse | undefined;
  return data?.data ?? null;
}

async function fetchJourneyProgress(
  mobile: string,
  journeyId: string
): Promise<JourneyProgress | null> {
  const { database } = await import('@/lib/firebase');
  const { ref, get } = await import('firebase/database');
  const snap = await get(
    ref(database, `userJourneysMobile/${mobile}/journeys/${journeyId}`)
  );
  if (!snap.exists()) return null;
  const data = snap.val() as Partial<JourneyProgress>;
  return {
    journeyId: data.journeyId ?? journeyId,
    name: data.name ?? '',
    icon: data.icon,
    currentDay: data.currentDay ?? 1,
    totalDays: data.totalDays ?? 0,
    streak: data.streak ?? 0,
    gems: data.gems ?? 0,
    isPremium: data.isPremium ?? false,
    progress: data.progress ?? 0,
    completedNodeIds: data.completedNodeIds ?? [],
    startDate: data.startDate ?? new Date().toISOString(),
    lastUpdated: data.lastUpdated ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useJourneys(options?: { limit?: number; search?: string; category?: string }) {
  const key = journeysKey(options?.category, options?.search);
  const { data, isLoading, error } = useSWR(
    key,
    () => fetchJourneyList({ limit: options?.limit, search: options?.search }),
    { ...swrConfig }
  );

  return {
    journeys: data ?? [],
    isLoading,
    error,
  };
}

export function useJourneyDetail(id: string | null) {
  const key = id ? journeyDetailKey(id) : null;
  const { data, isLoading, error } = useSWR(
    key,
    () => fetchJourneyDetail(id!),
    { ...swrConfig }
  );

  return {
    journey: data ?? null,
    isLoading,
    error,
  };
}

export function useJourneyProgress(journeyId: string | null) {
  const { user } = useAuth();
  const mobile = getMobileFromUser(user as Record<string, unknown>);
  const key = mobile && journeyId ? journeyProgressKey(mobile, journeyId) : null;

  const { data, isLoading, error } = useSWR(
    key,
    () => fetchJourneyProgress(mobile!, journeyId!),
    { ...swrConfig }
  );

  return {
    progress: data ?? null,
    isLoading,
    error,
    mobile,
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function subscribeToJourney(
  mobile: string,
  journey: JourneyItem
): Promise<void> {
  const { database } = await import('@/lib/firebase');
  const { ref, set } = await import('firebase/database');

  const journeyId = journey.documentId ?? journey.id;
  const name = extractJourneyName(journey.name);
  const totalDays = journey.steps?.length ?? 30;

  const record: JourneyProgress = {
    journeyId,
    name,
    icon: typeof journey.icon === 'string' ? journey.icon : undefined,
    currentDay: 1,
    totalDays,
    streak: 0,
    gems: 0,
    isPremium: journey.isPremium ?? false,
    progress: 0,
    completedNodeIds: [],
    startDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  await set(ref(database, `userJourneysMobile/${mobile}/journeys/${journeyId}`), record);

  // Revalidate progress cache
  await globalMutate(journeyProgressKey(mobile, journeyId));
}

export async function updateNodeProgress(
  mobile: string,
  journeyId: string,
  nodeId: string,
  totalNodes: number
): Promise<void> {
  const { database } = await import('@/lib/firebase');
  const { ref, get, set } = await import('firebase/database');

  const snap = await get(ref(database, `userJourneysMobile/${mobile}/journeys/${journeyId}`));
  if (!snap.exists()) return;

  const current = snap.val() as JourneyProgress;
  const completedNodeIds = Array.from(
    new Set([...(current.completedNodeIds ?? []), nodeId])
  );
  const progress = Math.round((completedNodeIds.length / Math.max(totalNodes, 1)) * 100);
  const gems = (current.gems ?? 0) + 10;

  // Update streak: if last update was yesterday or today, keep/increment
  const lastUpdated = new Date(current.lastUpdated ?? 0);
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - lastUpdated.setHours(0, 0, 0, 0)) / 86400000
  );
  const streak = diffDays <= 1 ? (current.streak ?? 0) + (diffDays === 1 ? 1 : 0) : 1;

  const updated: Partial<JourneyProgress> = {
    completedNodeIds,
    progress,
    gems,
    streak,
    lastUpdated: new Date().toISOString(),
  };

  await set(
    ref(database, `userJourneysMobile/${mobile}/journeys/${journeyId}`),
    { ...current, ...updated }
  );

  await globalMutate(journeyProgressKey(mobile, journeyId));
}
