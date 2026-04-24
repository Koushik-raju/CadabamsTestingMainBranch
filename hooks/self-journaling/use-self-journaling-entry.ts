import { selfJournalingEntryKey } from "@/lib/swr-keys";
import { journalingControllerGetEntry } from "@/sdk/backend-v2";
import type { JournalEntryResponseDto } from "@/sdk/backend-v2";
import useSWR from "swr";
import { mapDtoToEntry } from "./use-self-journaling";
import type { JournalEntry } from "./use-self-journaling";

export type { JournalEntry };

export function useSelfJournalingEntry(id: string | null | undefined) {
  const { data, error, isLoading } = useSWR<JournalEntry | null>(
    id ? selfJournalingEntryKey(id) : null,
    async () => {
      const res = await journalingControllerGetEntry({ path: { campus: "cadabams", id: id! } });
      const dto = res.data as JournalEntryResponseDto | undefined;
      return dto ? mapDtoToEntry(dto) : null;
    },
  );

  return { entry: data ?? null, isLoading, error };
}
