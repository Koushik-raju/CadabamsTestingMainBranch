/**
 * FILE: hooks/use-journaling.ts
 *
 * PURPOSE:
 *   SWR hooks and mutation helpers for the CMS self-journaling feature —
 *   categories, user entries, and create/delete actions.
 *
 * LOGIC OVERVIEW:
 *   1. useJournalingCategories — fetches published categories + sub-journalings
 *      from GET /api/v1/cms/journaling via axios.
 *   2. useSelfJournalingEntries — fetches the current user's entries from
 *      GET /api/v1/cms/journaling/self?crmLeadId=N via axios.
 *   3. useSelfJournalingEntry — fetches a single entry by ID.
 *   4. createSelfJournalingEntry — POSTs to /api/v1/cms/journaling/self with
 *      crmLeadId in the body, then revalidates the entries SWR key.
 *   5. deleteSelfJournalingEntry — DELETEs by ID and revalidates.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalingCategory         — CMS category with sub-journalings
 *   SubJournalingItem          — individual sub-journaling item
 *   SelfJournalingEntry        — user entry shape returned by CMS
 *   CreateSelfJournalingPayload — POST body; uses crmLeadId (number)
 *   useJournalingCategories    — { categories, subJournalings, isLoading, error }
 *   useSelfJournalingEntries   — { entries, total, isLoading, error, leadId }
 *   useSelfJournalingEntry     — { entry, isLoading, error }
 *   createSelfJournalingEntry  — async; returns created SelfJournalingEntry
 *   deleteSelfJournalingEntry  — async; void
 *
 * DEPENDENCIES:
 *   axios (cmsApi)     — direct HTTP to CMS endpoints (not SDK)
 *   swr                — caching + revalidation
 *   useAuth            — provides user.lead_id for crmLeadId
 *
 * LAST UPDATED: 2026-04-21 — identity migration: GET query param leadId →
 *   crmLeadId; CreateSelfJournalingPayload.leadId → crmLeadId
 */
import useSWR, { mutate as globalMutate } from 'swr';
import axios from 'axios';
import { CONFIG } from '@/config/env';
import { swrConfig } from '@/lib/swr-config';
import {
  journalingCategoriesKey,
  selfJournalingEntriesKey,
  selfJournalingEntryKey,
} from '@/lib/swr-keys';
import { useAuth } from '@/hooks/use-auth';

const cmsApi = axios.create({ baseURL: CONFIG.BACKEND_URL });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JournalingPrompt {
  heading?: string;
  text?: string;
}

export interface SubJournalingItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  aiPrompt?: string | null;
  status: string;
  recommendedCadence?: string | null;
}

export interface JournalingCategory {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  status: string;
  subJournalings?: SubJournalingItem[];
}

export interface SelfJournalingEntry {
  id: string;
  title?: string | null;
  stressLevel?: number | null;
  leadId?: number | null;
  entry?: string | null;
  emotion?: number | null;
  stressors?: string | null;
  prompts?: JournalingPrompt[] | null;
  subJournalingId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Fetchers — use BACKEND_URL + /api/v1/cms/journaling
// ---------------------------------------------------------------------------

async function fetchJournalingCategories(): Promise<JournalingCategory[]> {
  const { data } = await cmsApi.get<{ items?: JournalingCategory[]; total?: number }>(
    '/api/v1/cms/journaling',
    { params: { limit: 50, status: 'PUBLISHED' } },
  );
  return data?.items ?? [];
}

async function fetchSelfJournalingEntries(
  leadId: number,
  limit = 100,
): Promise<{ items: SelfJournalingEntry[]; total: number }> {
  const { data } = await cmsApi.get<{ items?: SelfJournalingEntry[]; total?: number }>(
    '/api/v1/cms/journaling/self',
    { params: { limit, offset: 0, crmLeadId: leadId } },
  );
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

async function fetchSelfJournalingEntry(
  id: string,
): Promise<SelfJournalingEntry | null> {
  const { data } = await cmsApi.get<SelfJournalingEntry>(
    `/api/v1/cms/journaling/self/${id}`,
  );
  return data ?? null;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch published journaling categories with sub-journalings */
export function useJournalingCategories() {
  const key = journalingCategoriesKey();
  const { data, isLoading, error } = useSWR(
    key,
    () => fetchJournalingCategories(),
    { ...swrConfig },
  );

  // Flatten all published sub-journalings across categories
  const subJournalings: SubJournalingItem[] =
    data?.flatMap((c) =>
      (c.subJournalings ?? []).filter((s) => s.status === 'PUBLISHED'),
    ) ?? [];

  return {
    categories: data ?? [],
    subJournalings,
    isLoading,
    error,
  };
}

/** Fetch current user's self-journaling entries */
export function useSelfJournalingEntries(limit?: number) {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;
  const key = leadId ? selfJournalingEntriesKey(leadId) : null;

  const { data, isLoading, error } = useSWR(
    key,
    () => fetchSelfJournalingEntries(leadId!, limit),
    { ...swrConfig },
  );

  return {
    entries: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    leadId,
  };
}

/** Fetch a single self-journaling entry by ID */
export function useSelfJournalingEntry(id: string | null) {
  const key = id ? selfJournalingEntryKey(id) : null;
  const { data, isLoading, error } = useSWR(
    key,
    () => fetchSelfJournalingEntry(id!),
    { ...swrConfig },
  );

  return {
    entry: data ?? null,
    isLoading,
    error,
  };
}

// ---------------------------------------------------------------------------
// Actions (mutations)
// ---------------------------------------------------------------------------

export interface CreateSelfJournalingPayload {
  title?: string;
  entry?: string;
  prompts?: JournalingPrompt[];
  emotion?: number;
  stressLevel?: number;
  stressors?: string;
  crmLeadId: number;
  subJournalingId?: string;
}

/** Create a new self-journaling entry via the CMS API */
export async function createSelfJournalingEntry(
  payload: CreateSelfJournalingPayload,
): Promise<SelfJournalingEntry> {
  const { data } = await cmsApi.post<SelfJournalingEntry>(
    '/api/v1/cms/journaling/self',
    payload,
  );

  // Revalidate the entries list
  await globalMutate(selfJournalingEntriesKey(payload.crmLeadId));

  return data;
}

/** Delete a self-journaling entry */
export async function deleteSelfJournalingEntry(
  id: string,
  leadId: number,
): Promise<void> {
  await cmsApi.delete(`/api/v1/cms/journaling/self/${id}`);

  await globalMutate(selfJournalingEntriesKey(leadId));
}
