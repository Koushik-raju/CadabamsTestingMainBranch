"use client";

import { CONFIG } from "@/config/env";
import { getAccessToken } from "@/lib/cookies";
import useSWR from "swr";

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
  const { data, isLoading, error, mutate } = useSWR("leaderboard", () => fetchLeaderboard(params), {
    revalidateOnFocus: false,
  });

  return { data, isLoading, error, mutate };
}
