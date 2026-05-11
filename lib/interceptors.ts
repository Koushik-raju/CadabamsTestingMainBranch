/**
 * FILE: lib/interceptors.ts
 *
 * PURPOSE:
 *   Axios interceptors for the shared backend-v2 axios instance — adds auth
 *   headers to outgoing requests and silently refreshes expired tokens on 401.
 *
 * LOGIC OVERVIEW:
 *   1. attachAuthInterceptor — request interceptor: reads the access token from
 *      cookies and sets Authorization: Bearer on every request except the
 *      refresh endpoint (to avoid sending an expired token to the endpoint
 *      that issues new ones, which would cause a 401 loop).
 *   2. attachRefreshInterceptor — response interceptor: on a 401, lazily
 *      imports refreshPatientToken, obtains new tokens, then retries the
 *      original request once. Guards against retrying the refresh call itself
 *      (a 401 on /auth/refresh means the refresh token is expired/invalid).
 *   3. isRefreshUrl — matches the full URL the SDK passes (baseURL pre-merged,
 *      config.url is absolute) against the refresh path suffix.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   attachAuthInterceptor   — call once on the shared axios instance
 *   attachRefreshInterceptor — call once on the shared axios instance
 *
 * DEPENDENCIES:
 *   getAccessToken    — reads access token cookie
 *   refreshPatientToken (lazy) — lib/auth.ts; lazy to break circular dep
 *
 * LAST UPDATED: 2026-04-28 — fix refresh loop: skip auth header + skip retry
 *   for refresh endpoint; use endsWith match because SDK pre-merges baseURL
 *   into the full URL before calling axios
 */

import type { AxiosInstance } from "axios";
import { getAccessToken } from "@/lib/cookies";

/* refreshPatientToken is imported lazily inside the 401 handler to break the
   circular dep: api/backend-v2 → interceptors → auth → sdk → api/backend-v2 */

const REFRESH_PATH = "/api/v1/auth/refresh";

/* The SDK passes the full URL to axios (baseURL is pre-merged into `url` and
   `baseURL` is set to '' on the request). So config.url is the full URL like
   "https://host/api/v1/auth/refresh" — we match by suffix, not equality. */
const isRefreshUrl = (url?: string) => !!url?.endsWith(REFRESH_PATH);

/** Attaches the access token as a Bearer header on every outgoing request.
 *  Skips the refresh endpoint — sending an expired token there causes a 401
 *  loop because the backend would reject the bearer before checking the body. */
export function attachAuthInterceptor(axiosInstance: AxiosInstance) {
  axiosInstance.interceptors.request.use(async (config) => {
    if (isRefreshUrl(config.url)) return config;

    const token = await getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });
}

/** On 401, silently refreshes the token and retries the original request once.
 *  Guards against retrying the refresh call itself to prevent infinite loops. */
export function attachRefreshInterceptor(axiosInstance: AxiosInstance) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      if (!original) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && isRefreshUrl(original.url)) {
        const { clearTokens } = await import("./cookies");
        await clearTokens();
        return Promise.reject(error);
      }

      /* Skip retry if: already retried, or the failing request IS the refresh
         endpoint (a 401 on refresh means the refresh token is expired/invalid). */
      if (error.response?.status === 401 && !original._retry && !isRefreshUrl(original.url)) {
        const hadAuth = !!(original.headers as { Authorization?: string })?.Authorization;
        if (!hadAuth) {
          return Promise.reject(error);
        }
        original._retry = true;

        try {
          const { refreshPatientToken } = await import("./auth");
          const tokenData = await refreshPatientToken();
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${tokenData.accessToken}`,
          };
          return axiosInstance(original);
        } catch {
          const { clearTokens } = await import("./cookies");
          await clearTokens();
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );
}
