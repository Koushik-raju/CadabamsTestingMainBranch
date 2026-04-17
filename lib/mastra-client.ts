/**
 * FILE: lib/mastra-client.ts
 *
 * PURPOSE:
 *   Factory that creates an authenticated MastraClient instance for use in
 *   chat session hooks.
 *
 * LOGIC OVERVIEW:
 *   Reads the current access token from cookies, derives the base URL origin
 *   from CONFIG.MASTRA_BACKEND_URL, and returns a configured MastraClient.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   createMastraClient — async factory; returns a MastraClient ready for API calls
 *
 * DEPENDENCIES:
 *   CONFIG.MASTRA_BACKEND_URL — from config/env.ts
 *   getAccessToken            — reads the access token from cookies
 *
 * LAST UPDATED: 2026-04-17 — import CONFIG from config/env.ts instead of lib/config
 */
import { MastraClient } from '@mastra/client-js';
import { getAccessToken } from '@/lib/cookies';
import { CONFIG } from '@/config/env';

export async function createMastraClient() {
  const token = await getAccessToken();
  const baseUrl = new URL(CONFIG.MASTRA_BACKEND_URL).origin;
  return new MastraClient({
    baseUrl,
    // ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  });
}
