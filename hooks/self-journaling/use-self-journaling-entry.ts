/**
 * FILE: hooks/self-journaling/use-self-journaling-entry.ts
 *
 * PURPOSE:
 *   SWR hook for fetching a single NestJS-backed journal entry by ID.
 *
 * LOGIC OVERVIEW:
 *   Calls journalingControllerGetEntry for the given ID; returns null when the
 *   entry cannot be found or the ID is not yet available. SWR key is null-gated
 *   so no request is made until an ID is provided.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalEntryResponseDto — SDK type for the entry shape
 *   useSelfJournalingEntry  — { entry, isLoading, error }
 *
 * DEPENDENCIES:
 *   journalingControllerGetEntry (sdk)
 *   SWR (useSWR)
 *
 * LAST UPDATED: 2026-04-27 — returns JournalEntryResponseDto directly from SDK;
 *   removed JournalEntry custom type re-export and mapDtoToEntry mapping.
 */
import { selfJournalingEntryKey } from "@/lib/swr-keys";
import { type JournalEntryResponseDto, journalingControllerGetEntry } from "@/sdk/backend-v2";
import useSWR from "swr";

export type { JournalEntryResponseDto };

export function useSelfJournalingEntry(id: string | null | undefined) {
  const { data, error, isLoading } = useSWR<JournalEntryResponseDto | null>(
    id ? selfJournalingEntryKey(id) : null,
    async () => {
      const res = await journalingControllerGetEntry({ path: { campus: "cadabams", id: id! } });
      if (res.error) return null;
      return (res.data as JournalEntryResponseDto | undefined) ?? null;
    },
  );

  return { entry: data ?? null, isLoading, error };
}
