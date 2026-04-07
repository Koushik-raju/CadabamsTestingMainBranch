import { MastraClient } from "@mastra/client-js";
import { getAccessToken } from "@/lib/cookies";
import { MASTRA_BACKEND_URL } from "./config";

export async function createMastraClient() {
  const token = await getAccessToken();
  const baseUrl = new URL(MASTRA_BACKEND_URL).origin;
  return new MastraClient({
    baseUrl,
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  });
}
