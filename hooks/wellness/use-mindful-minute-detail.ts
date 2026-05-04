/**
 * FILE: hooks/wellness/use-mindful-minute-detail.ts
 *
 * PURPOSE:
 *   SWR hook for fetching a single mindful minute collection by slug from the CMS.
 *
 * LOGIC OVERVIEW:
 *   1. Calls cmsMindfulMinutesControllerFindBySlug with the slug from the URL.
 *   2. Maps the response DTO to MindfulMinute (re-exported from use-mindful-minutes).
 *   3. Throws 'not_found' if the API returns no data.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   slugOrId             — slug string from URL params
 *   mindfulMinute        — mapped collection with audios array
 *   useMindfulMinuteDetail(slug) — returns { mindfulMinute, isLoading, error }
 *
 * DEPENDENCIES:
 *   cmsMindfulMinutesControllerFindBySlug — SDK CMS endpoint
 *   SWR — data fetching
 *
 * LAST UPDATED: 2026-04-16 — added createdAt to audio mapping, removed duration/category (SDK gap)
 */

"use client";

import useSWR from "swr";
import { mindfulMinuteDetailKey } from "@/lib/swr-keys";
import { cmsMindfulMinutesControllerFindBySlug } from "@/sdk/backend-v2";
import type { MindfulMinute } from "./use-mindful-minutes";

export type { MindfulMinute };

export function useMindfulMinuteDetail(slugOrId: string) {
  const { data, error, isLoading } = useSWR(
    slugOrId ? mindfulMinuteDetailKey(slugOrId) : null,
    async () => {
      const res = await cmsMindfulMinutesControllerFindBySlug({ path: { slug: slugOrId } });
      if (!res.data) throw new Error("not_found");
      const dto = res.data;
      return {
        id: dto.id,
        slug: dto.slug,
        title: dto.title,
        category: dto.category,
        coverImageUrl: typeof dto.coverImageUrl === "string" ? dto.coverImageUrl : undefined,
        audios: dto.audios?.map((a) => ({
          id: a.id,
          documentId: typeof a.documentId === "string" ? a.documentId : undefined,
          title: a.title,
          audioUrl: typeof a.audioUrl === "string" ? a.audioUrl : undefined,
          backgroundVisualUrl:
            typeof a.backgroundVisualUrl === "string" ? a.backgroundVisualUrl : undefined,
          createdAt: a.createdAt,
        })),
      } as MindfulMinute;
    },
    { revalidateOnFocus: false },
  );

  return {
    mindfulMinute: data ?? null,
    isLoading,
    error,
  };
}
