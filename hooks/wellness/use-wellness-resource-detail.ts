"use client";

import { fetchWellnessResourceBySlug } from "@/lib/strapi-fetcher";
import { wellnessResourceDetailKey } from "@/lib/swr-keys";
import useSWR from "swr";
export type { WellnessResource, ResourceBlock } from "./use-wellness-resources";

export function useWellnessResourceDetail(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? wellnessResourceDetailKey(slug) : null,
    () => fetchWellnessResourceBySlug(slug),
    { revalidateOnFocus: false },
  );

  return {
    resource: data ?? null,
    isLoading,
    error,
  };
}
