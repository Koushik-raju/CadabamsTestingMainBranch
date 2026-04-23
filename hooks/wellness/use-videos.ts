"use client";

import { fetchVideos } from "@/lib/strapi-fetcher";
import { videosKey } from "@/lib/swr-keys";
import useSWR from "swr";
export interface VideoItem {
  id: number;
  documentId?: string;
  slug: string;
  title: string;
  category?: string[];
  coverImage?: {
    webImage?: { url?: string };
    mobileImage?: { url?: string };
  };
  videoUrl?: string;
  text?: unknown[];
}

function buildCategories(videos: VideoItem[]): string[] {
  const set = new Set<string>();
  videos.forEach((v) => {
    const cats = Array.isArray(v.category) ? v.category : [];
    cats.forEach((c) => set.add(c));
  });
  return Array.from(set);
}

export function useVideos() {
  const { data, error, isLoading, mutate } = useSWR(videosKey(), fetchVideos, {
    revalidateOnFocus: false,
  });

  return {
    videos: data ?? [],
    categories: buildCategories(data ?? []),
    isLoading,
    error,
    mutate,
  };
}
