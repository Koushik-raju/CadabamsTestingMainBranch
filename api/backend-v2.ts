/**
 * FILE: api/backend-v2.ts
 *
 * PURPOSE:
 *   Configures the axios instance used by the generated backend-v2 SDK client,
 *   attaching auth and refresh interceptors for authenticated requests.
 *
 * LOGIC OVERVIEW:
 *   1. Creates a bare axios instance.
 *   2. On the client side (window defined), attaches auth and token-refresh interceptors.
 *   3. Exports createClientConfig so the SDK client picks up the base URL and instance.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   createClientConfig — SDK factory hook; sets baseURL from config and injects the axios instance
 *
 * DEPENDENCIES:
 *   CONFIG.BACKEND_URL    — from config/env.ts (single CONFIG export)
 *   attachAuthInterceptor — adds Authorization header to outgoing requests
 *   attachRefreshInterceptor — handles 401 responses and refreshes the token
 *
 * LAST UPDATED: 2026-04-17 — import BACKEND_URL from config/env.ts instead of reading process.env directly
 */
import axios from "axios";
import type { CreateClientConfig } from "@/sdk/backend-v2/client.gen";
import { attachAuthInterceptor, attachRefreshInterceptor } from "@/lib/interceptors";
import { CONFIG } from "@/config/env";

const instance = axios.create();

if (typeof window !== "undefined") {
  attachAuthInterceptor(instance);
  attachRefreshInterceptor(instance);
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: CONFIG.BACKEND_URL,
  axios: instance,   // key must be `axios`, not `instance`
});
