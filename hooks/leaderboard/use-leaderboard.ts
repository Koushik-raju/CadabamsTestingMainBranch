/**
 * FILE: hooks/leaderboard/use-leaderboard.ts
 *
 * PURPOSE:
 *   SWR hook for fetching leaderboard data with optional filter parameters.
 *
 * LOGIC OVERVIEW:
 *   - Uses SWR with a composite key (array) so different param combinations
 *     get separate cache slots. When params change, SWR automatically refetches.
 *   - fetchLeaderboard builds the query URL and adds auth headers.
 *   - Hook returns data, loading, error, and a mutate function for manual
 *     cache invalidation.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   params          — optional filters (e.g., { doctorId: 123 })
 *   fetchLeaderboard — async function that builds the request and throws on error
 *   data            — array of leaderboard items
 *   mutate          — function to manually revalidate/invalidate cache
 *
 * DEPENDENCIES:
 *   SWR
 *   getAccessToken — from @/lib/cookies
 *   CONFIG.BACKEND_URL
 *
 * LAST UPDATED: 2026-05-05 — Fixed SWR key collision: changed static key to array key
 *   so different params get separate cache slots; prevents results overwriting
 */
"use client";

import useSWR from "swr";
import { CONFIG } from "@/config/env";
import { getAccessToken } from "@/lib/cookies";

async function fetchLeaderboard(params?: Record<string, unknown>) {
  const token = await getAccessToken();
  const url = new URL(`${CONFIG.BACKEND_URL}/leaderboard`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  return res.json();
}

export function useLeaderboard(params?: Record<string, unknown>) {
  // Use array key so SWR deeply compares params and creates separate cache
  // slots for different filter combinations. Static key would cause all calls
  // to share one cache entry, overwriting results.
  const { data, isLoading, error, mutate } = useSWR(
    ["leaderboard", params ?? {}],
    () => fetchLeaderboard(params),
    {
      revalidateOnFocus: false,
    },
  );

  return { data, isLoading, error, mutate };
}
