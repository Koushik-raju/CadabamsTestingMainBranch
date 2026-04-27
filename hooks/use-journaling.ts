/**
 * FILE: hooks/use-journaling.ts
 *
 * PURPOSE:
 *   SWR hooks and mutation helpers for the self-journaling feature —
 *   categories, user entries, create/delete actions, and AI prompt generation.
 *
 * LOGIC OVERVIEW:
 *   1. useJournalingCategories — fetches published categories + sub-journalings
 *      via cmsJournalingControllerGetJournalings SDK function.
 *   2. useSelfJournalingEntries — fetches the current user's entries via
 *      journalingControllerListMine (campus-based, returns entries owned by
 *      the authenticated user — no leadId filter needed).
 *   3. useSelfJournalingEntry — fetches a single entry by ID via
 *      journalingControllerGetEntry SDK function.
 *   4. createSelfJournalingEntry — creates an entry via
 *      journalingControllerCreateEntry SDK function, then revalidates the
 *      entries SWR key.
 *   5. deleteSelfJournalingEntry — deletes an entry via
 *      journalingControllerDeleteEntry SDK function.
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
 *   JournalEntryResponseDto    — re-exported SDK type; user journal entry
 *   JournalPromptDto           — re-exported SDK type; single prompt response
 *   useJournalingCategories    — { categories, subJournalings, isLoading, error }
 *   useSelfJournalingEntries   — { entries, isLoading, error }
 *   useSelfJournalingEntry     — { entry, isLoading, error }
 *   createSelfJournalingEntry  — async; returns JournalEntryResponseDto
 *   deleteSelfJournalingEntry  — async; void
 *   generateJournalPrompt      — async; returns AI question string or null on error
 *   extractString              — converts { [key]: unknown } Strapi fields to string
 *
 * DEPENDENCIES:
 *   cmsJournalingControllerGetJournalings (sdk) — CMS category list
 *   journalingController* (sdk)                 — campus-level entry CRUD
 *   journalingControllerPromptMe (sdk)          — AI prompt generation
 *   swr                                         — caching + revalidation
 *   useAuth                                     — provides campus user identity
 *
 * LAST UPDATED: 2026-04-27 — generateJournalPrompt now accepts ConversationTurnDto[]
 *   instead of flat currentEntryText string so the LLM gets a proper multi-turn thread.
 */
import { useAuth } from "@/hooks/use-auth";
import { swrConfig } from "@/lib/swr-config";
import { journalingCategoriesKey, selfJournalingEntryKey, selfJournalingKey } from "@/lib/swr-keys";
import {
  type ConversationTurnDto,
  type JournalEntryResponseDto,
  type JournalPromptDto,
  type JournalingResponseDto,
  type SubJournalingResponseDto,
  cmsJournalingControllerGetJournalings,
  journalingControllerCreateEntry,
  journalingControllerDeleteEntry,
  journalingControllerGetEntry,
  journalingControllerListMine,
  journalingControllerPromptMe,
} from "@/sdk/backend-v2";
import useSWR, { mutate as globalMutate } from "swr";

export type {
  ConversationTurnDto,
  JournalingResponseDto,
  SubJournalingResponseDto,
  JournalEntryResponseDto,
  JournalPromptDto,
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
    categories: data ?? ([] as JournalingResponseDto[]),
    subJournalings,
    isLoading,
    error,
  };
}

/** Fetch current user's self-journaling entries. */
export function useSelfJournalingEntries(_limit?: number) {
  const { user } = useAuth();
  /*
   * journalingControllerListMine is campus-scoped and returns only the
   * authenticated user's entries — no leadId filter required. The SWR key
   * is gated on user identity so the cache is per-user.
   */
  const key = user ? selfJournalingKey() : null;

  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      const res = await journalingControllerListMine({ path: { campus: "cadabams" } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? [];
    },
    { ...swrConfig },
  );

  return {
    entries: data ?? ([] as JournalEntryResponseDto[]),
    isLoading,
    error,
  };
}

/** Fetch a single self-journaling entry by ID. */
export function useSelfJournalingEntry(id: string | null) {
  const key = id ? selfJournalingEntryKey(id) : null;
  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      const res = await journalingControllerGetEntry({ path: { campus: "cadabams", id: id! } });
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

/** Create a new self-journaling entry via the campus JournalEntry endpoint. */
export async function createSelfJournalingEntry(payload: {
  title?: string;
  entryText?: string;
  prompts?: Array<JournalPromptDto>;
  emotion?: number;
  stressLevel?: number;
  stressors?: string;
  subJournalingId?: string;
}): Promise<JournalEntryResponseDto> {
  const res = await journalingControllerCreateEntry({
    path: { campus: "cadabams" },
    body: {
      title: payload.title,
      entryText: payload.entryText,
      prompts: payload.prompts,
      stressLevel: payload.stressLevel,
      emotion: payload.emotion,
      stressors: payload.stressors,
      subJournalingId: payload.subJournalingId,
    },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));

  await globalMutate(selfJournalingKey());

  return res.data!;
}

/** Delete a self-journaling entry. */
export async function deleteSelfJournalingEntry(id: string): Promise<void> {
  const res = await journalingControllerDeleteEntry({ path: { campus: "cadabams", id } });
  if (res.error) throw new Error(JSON.stringify(res.error));

  await globalMutate(selfJournalingKey());
}

/**
 * Generate an AI reflective question for a specific sub-journal.
 * The backend fetches user context (recent entries, baseline assessment) from DB
 * and returns a personalized question. Returns null on any error.
 *
 * conversationHistory — ordered list of turns already shown this session
 * (assistant = AI question, user = patient answer). The backend injects these as
 * real multi-turn LLM messages so the model can distinguish its own questions from
 * the user's answers and avoid repeating a question already asked.
 */
export async function generateJournalPrompt(
  subJournalingId: string,
  conversationHistory?: ConversationTurnDto[],
): Promise<string | null> {
  const res = await journalingControllerPromptMe({
    path: { campus: "cadabams" },
    body: { subJournalingId, conversationHistory },
  });
  if (res.error) return null;
  return res.data?.question ?? null;
}
