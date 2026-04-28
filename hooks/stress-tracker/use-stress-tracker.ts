/**
 * FILE: hooks/stress-tracker/use-stress-tracker.ts
 *
 * PURPOSE:
 *   SWR hooks + action helpers for the standalone Stress Tracker feature.
 *
 * LOGIC OVERVIEW:
 *   1. STRESS_LEVELS — canonical 1..5 → label map.
 *   2. STRESS_REASONS — canonical stressor list (matches the legacy
 *      /stress-management/selector page).
 *   3. useStressEntries / useStressReport — SWR fetch helpers.
 *   4. submitStressEntry — POSTs a new StressEntry.
 *
 * KEY VARIABLES / EXPORTS:
 *   STRESS_LEVELS, STRESS_REASONS, StressEntry, StressTrackerReport,
 *   useStressEntries, useStressReport, submitStressEntry.
 *
 * DEPENDENCIES:
 *   swr, apiClient.
 *
 * LAST UPDATED: 2026-04-28 — initial creation.
 */
import { apiClient } from "@/api/backend-v2";
import useSWR from "swr";

const CAMPUS = "cadabams";

export const STRESS_LEVELS: { score: number; label: string }[] = [
  { score: 1, label: "Very Low" },
  { score: 2, label: "Low" },
  { score: 3, label: "Moderate" },
  { score: 4, label: "High" },
  { score: 5, label: "Very High" },
];

export const STRESS_REASONS = [
  "Work",
  "Finance",
  "Health",
  "Relationship",
  "Family",
  "Life",
  "Others",
];

export interface StressEntry {
  id: string;
  crmLeadId: string | null;
  patientRef: string | null;
  campus: string;
  stressLevel: number;
  stressLevelLabel: string | null;
  stressReasons: string[];
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StressEntryListResponse {
  items: StressEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface StressTrackerReport {
  count: number;
  averageLevel: number | null;
  levelBuckets: Record<string, number>;
  topReasons: { label: string; count: number }[];
  from?: string;
  to?: string;
}

export interface CreateStressEntryBody {
  stressLevel: number;
  stressLevelLabel?: string;
  stressReasons?: string[];
  loggedAt?: string;
}

export function useStressEntries(limit = 30) {
  return useSWR<StressEntryListResponse>(["stress-tracker", "list", limit], async () => {
    const res = await apiClient.get<StressEntryListResponse>(`/api/v1/${CAMPUS}/stress-tracker`, {
      params: { limit },
    });
    return res.data;
  });
}

export function useStressReport(from?: string, to?: string) {
  return useSWR<StressTrackerReport>(
    ["stress-tracker", "report", from ?? "", to ?? ""],
    async () => {
      const res = await apiClient.get<StressTrackerReport>(
        `/api/v1/${CAMPUS}/stress-tracker/report`,
        { params: { from, to } },
      );
      return res.data;
    },
  );
}

export function useLatestStressEntry() {
  const { data, ...rest } = useStressEntries(1);
  return { latest: data?.items[0] ?? null, ...rest };
}

export async function submitStressEntry(body: CreateStressEntryBody): Promise<StressEntry> {
  const res = await apiClient.post<StressEntry>(`/api/v1/${CAMPUS}/stress-tracker`, body);
  return res.data;
}
