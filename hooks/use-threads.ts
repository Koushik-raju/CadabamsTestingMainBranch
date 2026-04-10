import useSWR from "swr";
import { swrConfig } from "@/lib/swr-config";
import { createMastraClient } from "@/lib/mastra-client";
import { normalizeThread } from "@/lib/chat";

export function useThreads(resourceId: string | undefined) {
  return useSWR(
    resourceId ? ["threads", resourceId] : null,
    async () => {
      const client = await createMastraClient();
      const result = await client.listMemoryThreads({ resourceId: resourceId! });
      return (result.threads ?? []).map(normalizeThread);
    },
    swrConfig,
  );
}