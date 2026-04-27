/**
 * FILE: hooks/use-journaling.ts
 *
 * PURPOSE:
 *   SWR hooks and mutation helpers for the CMS self-journaling feature —
 *   categories, user entries, create/delete actions, and AI prompt generation.
 *
 * LOGIC OVERVIEW:
 *   1. useJournalingCategories — fetches published categories + sub-journalings
 *      via cmsJournalingControllerGetJournalings SDK function.
 *   2. useSelfJournalingEntries — fetches the current user's entries via
 *      cmsJournalingControllerGetSelfJournalings SDK function.
 *   3. useSelfJournalingEntry — fetches a single entry by ID via
 *      cmsJournalingControllerGetSelfJournalingById SDK function.
 *   4. createSelfJournalingEntry — creates an entry via
 *      cmsJournalingControllerCreateSelfJournaling SDK function, then
 *      revalidates the entries SWR key.
 *   5. deleteSelfJournalingEntry — deletes an entry via
 *      cmsJournalingControllerDeleteSelfJournaling SDK function.
 *   6. generateJournalPrompt — calls POST /api/v1/{campus}/journaling/prompt-me
 *      via journalingControllerPromptMe SDK function; the backend fetches user
 *      context from DB and returns an AI-generated reflective question.
 *      Returns null on any error so callers can fall back gracefully.
 *   7. extractString — utility for converting Strapi-style { [key]: unknown }
 *      response fields to plain strings (used in consuming pages).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalingResponseDto      — re-exported SDK type; journaling category
 *   SubJournalingResponseDto   — re-exported SDK type; sub-journaling item
 *   SelfJournalingResponseDto  — re-exported SDK type; user journal entry
 *   SelfJournalingPromptDto    — re-exported SDK type; single prompt response
 *   useJournalingCategories    — { categories, subJournalings, isLoading, error }
 *   useSelfJournalingEntries   — { entries, total, isLoading, error, leadId }
 *   useSelfJournalingEntry     — { entry, isLoading, error }
 *   createSelfJournalingEntry  — async; returns SelfJournalingResponseDto
 *   deleteSelfJournalingEntry  — async; void
 *   generateJournalPrompt      — async; returns AI question string or null on error
 *   extractString              — converts { [key]: unknown } Strapi fields to string
 *
 * DEPENDENCIES:
 *   cmsJournalingController* (sdk)       — CMS journaling CRUD SDK functions
 *   journalingControllerPromptMe (sdk)   — AI prompt generation SDK function
 *   swr                                  — caching + revalidation
 *   useAuth                              — provides user.lead_id for leadId
 *
 * LAST UPDATED: 2026-04-27 — categories fetch with status ALL (parents may be DRAFT);
 *   generateJournalPrompt accepts currentEntryText for sequential prompt context.
 */
import { useAuth } from "@/hooks/use-auth";
import { swrConfig } from "@/lib/swr-config";
import {
  journalingCategoriesKey,
  selfJournalingEntriesKey,
  selfJournalingEntryKey,
} from "@/lib/swr-keys";
import {
  type JournalingResponseDto,
  type SelfJournalingPromptDto,
  type SelfJournalingResponseDto,
  type SubJournalingResponseDto,
  cmsJournalingControllerCreateSelfJournaling,
  cmsJournalingControllerDeleteSelfJournaling,
  cmsJournalingControllerGetJournalings,
  cmsJournalingControllerGetSelfJournalingById,
  cmsJournalingControllerGetSelfJournalings,
  journalingControllerPromptMe,
} from "@/sdk/backend-v2";
import useSWR, { mutate as globalMutate } from "swr";

export type {
  JournalingResponseDto,
  SubJournalingResponseDto,
  SelfJournalingResponseDto,
  SelfJournalingPromptDto,
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/*
 * CMS (Strapi) API returns certain text fields as { [key: string]: unknown }
 * objects (e.g. { en: "Hello" }) rather than plain strings. This helper
 * safely extracts the string value for display. Plain strings pass through
 * unchanged.
 */
export function extractString(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    for (const k of ["en", "value", "text", "content"]) {
      if (typeof o[k] === "string") return o[k] as string;
    }
  }
  return "";
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch journaling categories with sub-journalings. */
export function useJournalingCategories() {
  const key = journalingCategoriesKey();
  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      /*
       * Fetch ALL parent CmsJournaling records (status: "ALL" = no filter).
       * Parent records in the DB commonly have status DRAFT even when their
       * child CmsSubJournaling records are PUBLISHED. Page-level filters
       * check sub-journaling status instead of parent status.
       */
      const res = await cmsJournalingControllerGetJournalings({
        query: { limit: 50, status: "ALL" },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data?.data ?? [];
    },
    { ...swrConfig },
  );

  // Flatten all published sub-journalings across categories
  const subJournalings: SubJournalingResponseDto[] =
    data?.flatMap((c) => (c.subJournalings ?? []).filter((s) => s.status === "PUBLISHED")) ?? [];

  return {
    categories: data ?? [] as JournalingResponseDto[],
    subJournalings,
    isLoading,
    error,
  };
}

/** Fetch current user's self-journaling entries. */
export function useSelfJournalingEntries(limit?: number) {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;
  const key = leadId ? selfJournalingEntriesKey(leadId) : null;

  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      const res = await cmsJournalingControllerGetSelfJournalings({
        query: { limit: limit ?? 100, offset: 0, leadId: leadId! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return { entries: res.data?.data ?? [], total: res.data?.total ?? 0 };
    },
    { ...swrConfig },
  );

  return {
    entries: data?.entries ?? [] as SelfJournalingResponseDto[],
    total: data?.total ?? 0,
    isLoading,
    error,
    leadId,
  };
}

/** Fetch a single self-journaling entry by ID. */
export function useSelfJournalingEntry(id: string | null) {
  const key = id ? selfJournalingEntryKey(id) : null;
  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      const res = await cmsJournalingControllerGetSelfJournalingById({ path: { id: id! } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? null;
    },
    { ...swrConfig },
  );

  return {
    entry: data ?? null,
    isLoading,
    error,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new self-journaling entry.
 * Note: The SDK types title/entry/stressors/subJournalingId as
 * { [key: string]: unknown } due to Strapi's dynamic schema, but the
 * CMS API accepts plain strings at runtime. The cast below is the minimal
 * workaround for this SDK generator artifact.
 */
export async function createSelfJournalingEntry(payload: {
  title?: string;
  entry?: string;
  prompts?: Array<SelfJournalingPromptDto>;
  emotion?: number;
  stressLevel?: number;
  stressors?: string;
  crmLeadId: number;
  subJournalingId?: string;
}): Promise<SelfJournalingResponseDto> {
  const res = await cmsJournalingControllerCreateSelfJournaling({
    body: {
      leadId: payload.crmLeadId,
      prompts: payload.prompts,
      stressLevel: payload.stressLevel,
      emotion: payload.emotion,
      // The CMS API accepts strings here; the SDK types them as objects (Strapi generator artifact)
      title: payload.title as never,
      entry: payload.entry as never,
      stressors: payload.stressors as never,
      subJournalingId: payload.subJournalingId as never,
    },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));

  await globalMutate(selfJournalingEntriesKey(payload.crmLeadId));

  return res.data!;
}

/** Delete a self-journaling entry. */
export async function deleteSelfJournalingEntry(id: string, leadId: number): Promise<void> {
  const res = await cmsJournalingControllerDeleteSelfJournaling({ path: { id } });
  if (res.error) throw new Error(JSON.stringify(res.error));

  await globalMutate(selfJournalingEntriesKey(leadId));
}

/**
 * Generate an AI reflective question for a specific sub-journal.
 * The backend fetches user context (recent entries, baseline assessment) from DB
 * and returns a personalized question. Returns null on any error.
 *
 * currentEntryText — optional in-progress session text built from savedPrompts +
 * active textarea content. Passing it lets the AI's sequential aiPrompt template
 * determine which question to ask next (e.g. Evening Reset Q1→Q2→Q3…) rather than
 * always regenerating from scratch and repeating Q1.
 *
 */
export async function generateJournalPrompt(
  subJournalingId: string,
  currentEntryText?: string,
): Promise<string | null> {
  const res = await journalingControllerPromptMe({
    path: { campus: "cadabams" },
    body: { subJournalingId, currentEntryText },
  });
  if (res.error) return null;
  return res.data?.question ?? null;
}
