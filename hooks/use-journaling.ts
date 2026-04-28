/**
 * FILE: hooks/use-journaling.ts
 *
 * PURPOSE:
 *   SWR hooks and mutation helpers for journaling categories and user journal
 *   entries. All types come from the generated SDK — no custom shapes.
 *
 * LOGIC OVERVIEW:
 *   useJournalingCategories() — fetches published CMS journaling categories via
 *     cmsJournalingControllerGetJournalings; flattens published sub-journalings.
 *   useSelfJournalingEntries(limit?) — fetches the authenticated user's entries
 *     via journalingControllerListMine; limit param is accepted for call-site
 *     compatibility but ignored (SDK endpoint returns all entries for the user).
 *   useSelfJournalingEntry(id) — fetches a single entry by ID.
 *   createSelfJournalingEntry(payload) — creates an entry via the SDK and
 *     revalidates the entries list.
 *   deleteSelfJournalingEntry(id) — deletes an entry and revalidates.
 *   extractString(val) — converts Strapi JSON-object field values to plain
 *     strings; many SDK types return { [key:string]:unknown } instead of string.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalingResponseDto      — re-exported SDK type; single category shape
 *   SubJournalingResponseDto   — re-exported SDK type; single sub-journaling
 *   JournalEntryResponseDto    — re-exported SDK type; single entry shape
 *   JournalPromptDto           — re-exported SDK type; single prompt shape
 *   CreateJournalEntryDto      — re-exported SDK type; create-entry payload
 *   useJournalingCategories    — { categories, subJournalings, isLoading, error }
 *   useSelfJournalingEntries   — { entries, isLoading, error }
 *   useSelfJournalingEntry     — { entry, isLoading, error }
 *   createSelfJournalingEntry  — async; returns JournalEntryResponseDto | null
 *   deleteSelfJournalingEntry  — async; void
 *   generateJournalPrompt      — async; returns GeneratedJournalPromptResponseDto | null
 *   ConversationTurnDto        — re-exported SDK type; AI conversation turn shape
 *   extractString              — (val: unknown) => string
 *
 * DEPENDENCIES:
 *   cmsJournalingControllerGetJournalings (sdk)
 *   journalingControllerListMine / GetEntry / CreateEntry / DeleteEntry / PromptMe (sdk)
 *   SWR (useSWR, mutate)
 *
 * LAST UPDATED: 2026-04-28 — added generateJournalPrompt and ConversationTurnDto
 *   re-export to fix journal-writer.tsx build error.
 */
import { swrConfig } from "@/lib/swr-config";
import { journalingCategoriesKey, selfJournalingEntryKey, selfJournalingKey } from "@/lib/swr-keys";
import {
  type ConversationTurnDto,
  type CreateJournalEntryDto,
  type GeneratedJournalPromptResponseDto,
  type JournalEntryResponseDto,
  type JournalPromptDto,
  type JournalingListResponseDto,
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
  CreateJournalEntryDto,
  JournalEntryResponseDto,
  JournalPromptDto,
  JournalingResponseDto,
  SubJournalingResponseDto,
};

// ---------------------------------------------------------------------------
// extractString
// Strapi JSON fields come back as { [key: string]: unknown } | null instead of
// plain strings. Walk the object's own string values and return the first one.
// ---------------------------------------------------------------------------
export function extractString(val: unknown): string {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    for (const v of Object.values(val as Record<string, unknown>)) {
      if (typeof v === "string") return v;
    }
  }
  return String(val);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch published journaling categories with their published sub-journalings. */
export function useJournalingCategories() {
  const { data, isLoading, error } = useSWR(
    journalingCategoriesKey(),
    async () => {
      const res = await cmsJournalingControllerGetJournalings({
        query: { limit: 50, status: "PUBLISHED" },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return (res.data as JournalingListResponseDto | undefined)?.data ?? [];
    },
    { ...swrConfig },
  );

  const categories: JournalingResponseDto[] = data ?? [];

  /* Flatten all published sub-journalings across categories for quick lookup. */
  const subJournalings: SubJournalingResponseDto[] = categories.flatMap((c) =>
    (c.subJournalings ?? []).filter((s) => s.status === "PUBLISHED"),
  );

  return { categories, subJournalings, isLoading, error };
}

/**
 * Fetch the authenticated user's journal entries, sorted newest-first.
 * The `_limit` param is accepted for call-site compatibility but ignored —
 * journalingControllerListMine returns all entries for the current user.
 */
export function useSelfJournalingEntries(_limit?: number) {
  const { data, isLoading, error } = useSWR<JournalEntryResponseDto[]>(
    selfJournalingKey(),
    async () => {
      const res = await journalingControllerListMine({ path: { campus: "cadabams" } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const entries = (res.data ?? []) as JournalEntryResponseDto[];
      return entries.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    { ...swrConfig },
  );

  return { entries: data ?? [], isLoading, error };
}

/** Fetch a single journal entry by ID. */
export function useSelfJournalingEntry(id: string | null | undefined) {
  const { data, isLoading, error } = useSWR<JournalEntryResponseDto | null>(
    id ? selfJournalingEntryKey(id) : null,
    async () => {
      const res = await journalingControllerGetEntry({ path: { campus: "cadabams", id: id! } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return (res.data as JournalEntryResponseDto | undefined) ?? null;
    },
    { ...swrConfig },
  );

  return { entry: data ?? null, isLoading, error };
}

// ---------------------------------------------------------------------------
// AI prompt generation
// ---------------------------------------------------------------------------

/** Generate the next AI journal question for a sub-journaling session. */
export async function generateJournalPrompt(
  subJournalingId: string,
  conversationHistory?: ConversationTurnDto[],
): Promise<GeneratedJournalPromptResponseDto | null> {
  const res = await journalingControllerPromptMe({
    path: { campus: "cadabams" },
    body: { subJournalingId, conversationHistory },
  });
  if (res.error) return null;
  return (res.data as GeneratedJournalPromptResponseDto | undefined) ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new journal entry and revalidate the entries list. */
export async function createSelfJournalingEntry(
  payload: CreateJournalEntryDto,
): Promise<JournalEntryResponseDto | null> {
  const res = await journalingControllerCreateEntry({
    path: { campus: "cadabams" },
    body: payload,
  });
  if (res.error) return null;
  await globalMutate(selfJournalingKey());
  return (res.data as JournalEntryResponseDto | undefined) ?? null;
}

/** Delete a journal entry and revalidate the entries list. */
export async function deleteSelfJournalingEntry(id: string): Promise<void> {
  await journalingControllerDeleteEntry({ path: { campus: "cadabams", id } });
  await globalMutate(selfJournalingKey());
}
