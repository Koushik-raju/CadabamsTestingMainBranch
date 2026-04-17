/**
 * FILE: hooks/use-threads.ts
 *
 * PURPOSE:
 *   SWR hook that fetches the list of all chat threads for a given resourceId.
 *   Used by the chat history page and the history drawer.
 *
 * LOGIC OVERVIEW:
 *   1. When resourceId is defined, uses threadsKey(resourceId) as the SWR cache key.
 *   2. Fetches threads via createMastraClient().listMemoryThreads({ resourceId }).
 *   3. Normalises each thread (converts date strings to Date objects).
 *   4. Returns the SWR result (data, isLoading, error, mutate).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   resourceId   — the user's identity string; key is null until this is set
 *   useThreads   — exported hook returning SWR result for the threads list
 *
 * DEPENDENCIES:
 *   swr, createMastraClient, normalizeThread, threadsKey
 *
 * LAST UPDATED: 2026-04-16 — switched to threadsKey from swr-keys
 */
import useSWR from "swr";
import { swrConfig } from "@/lib/swr-config";
import { createMastraClient } from "@/lib/mastra-client";
import { normalizeThread } from "@/lib/chat";
import { threadsKey } from "@/lib/swr-keys";

export function useThreads(resourceId: string | undefined) {
  return useSWR(
    resourceId ? threadsKey(resourceId) : null,
    async () => {
      const client = await createMastraClient();
      const result = await client.listMemoryThreads({ resourceId: resourceId! });
      return (result.threads ?? []).map(normalizeThread);
    },
    swrConfig,
  );
}
