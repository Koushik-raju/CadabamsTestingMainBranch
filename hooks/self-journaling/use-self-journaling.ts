/**
 * FILE: hooks/self-journaling/use-self-journaling.ts
 *
 * PURPOSE:
 *   SWR hook and mutation helpers for the NestJS-backed journal entry feature.
 *   Covers fetching the user's entry list and create/update/delete mutations.
 *
 * LOGIC OVERVIEW:
 *   useSelfJournaling() — fetches all entries via journalingControllerListMine
 *     sorted newest-first. Returns JournalEntryResponseDto[] directly from the SDK.
 *   createEntry / updateEntry / deleteEntry — thin mutation wrappers around the
 *     corresponding SDK functions. Callers are responsible for SWR revalidation.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalEntryResponseDto — re-exported SDK type; single entry shape
 *   JournalPromptDto        — re-exported SDK type; single prompt response shape
 *   useSelfJournaling       — { entries, isLoading, error, mutate }
 *   createEntry             — async; returns JournalEntryResponseDto | null
 *   updateEntry             — async; returns JournalEntryResponseDto | null
 *   deleteEntry             — async; void
 *
 * DEPENDENCIES:
 *   journalingControllerListMine / CreateEntry / UpdateEntry / DeleteEntry (sdk)
 *   SWR (useSWR)
 *
 * LAST UPDATED: 2026-04-27 — removed custom JournalEntry/JournalPrompt types;
 *   returns SDK types directly; removed mapDtoToEntry conversion layer.
 */
import { selfJournalingKey } from "@/lib/swr-keys";
import {
  type CreateJournalEntryDto,
  type JournalEntryResponseDto,
  type JournalPromptDto,
  type UpdateJournalEntryDto,
  journalingControllerCreateEntry,
  journalingControllerDeleteEntry,
  journalingControllerListMine,
  journalingControllerUpdateEntry,
} from "@/sdk/backend-v2";
import useSWR from "swr";

export type { JournalEntryResponseDto, JournalPromptDto };

export function useSelfJournaling() {
  const { data, error, isLoading, mutate } = useSWR<JournalEntryResponseDto[]>(
    selfJournalingKey(),
    async () => {
      const res = await journalingControllerListMine({ path: { campus: "cadabams" } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const entries = (res.data ?? []) as JournalEntryResponseDto[];
      return entries.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
  );

  return { entries: data ?? [], isLoading, error, mutate };
}

/*
 * subJournalingId is accepted by the backend but not yet in the SDK's
 * CreateJournalEntryDto — it was added in a backend DTO change that needs a
 * SDK regeneration to surface. The `as CreateJournalEntryDto` cast passes it
 * through at runtime. Remove the cast after running `pnpm run generate:sdk`.
 */
export async function createEntry(
  body: CreateJournalEntryDto & { subJournalingId?: string },
): Promise<JournalEntryResponseDto | null> {
  const res = await journalingControllerCreateEntry({
    path: { campus: "cadabams" },
    body: body as CreateJournalEntryDto,
  });
  if (res.error) return null;
  return (res.data as JournalEntryResponseDto | undefined) ?? null;
}

export async function updateEntry(
  id: string,
  body: UpdateJournalEntryDto,
): Promise<JournalEntryResponseDto | null> {
  const res = await journalingControllerUpdateEntry({ path: { campus: "cadabams", id }, body });
  if (res.error) return null;
  return (res.data as JournalEntryResponseDto | undefined) ?? null;
}

export async function deleteEntry(id: string): Promise<void> {
  await journalingControllerDeleteEntry({ path: { campus: "cadabams", id } });
}
