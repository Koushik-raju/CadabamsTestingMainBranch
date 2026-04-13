'use client';

import useSWRInfinite from 'swr/infinite';
import { fetchWellnessResourcesList } from '@/lib/strapi-fetcher';
import type { WellnessResource } from '@/types/wellness';
import type { StrapiPagination } from '@/lib/strapi-fetcher';

const PAGE_SIZE = 12;

type FetchResult = {
  resources: WellnessResource[];
  pagination: StrapiPagination;
};

type Key = readonly [string, number, number, string, string];

/** Unified hook for browsing wellness resources with infinite scroll */
export function useWellnessResources({
  search = '',
  category = 'All',
}: {
  search?: string;
  category?: string;
} = {}) {
  const getKey = (pageIndex: number, previousPageData: FetchResult | null): Key | null => {
    // End of list: previous page had no items or we've exhausted all pages
    if (previousPageData) {
      const { pagination } = previousPageData;
      const totalPages = pagination.pageCount ?? Math.ceil((pagination.total ?? 0) / PAGE_SIZE);
      if (pageIndex + 1 > totalPages) return null;
      if (!previousPageData.resources.length) return null;
    }
    return [
      '/wellness-resources',
      pageIndex + 1,
      PAGE_SIZE,
      search.trim(),
      category === 'All' ? '' : category,
    ] as const;
  };

  const { data, error, isLoading, isValidating, setSize, size } = useSWRInfinite<FetchResult, Error>(
    getKey,
    ([_prefix, page, pageSize, s, cat]: Key) =>
      fetchWellnessResourcesList({ page, pageSize, search: s, category: cat }),
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      parallel: false,
    }
  );

  const allResources = data?.flatMap((d) => d.resources) ?? [];
  const lastPage = data?.[data.length - 1];
  const pagination = lastPage?.pagination ?? null;
  const totalCount = pagination?.total ?? 0;
  const hasMore = allResources.length < totalCount;
  const isLoadingMore = isValidating && (data?.length ?? 0) > 0;

  // Derive categories from all loaded resources
  const categories = (() => {
    const set = new Set<string>();
    allResources.forEach((r) => {
      const cats = Array.isArray(r.category) ? r.category : r.category ? [r.category as string] : [];
      cats.forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  })();

  const loadMore = () => {
    if (!isValidating && hasMore) setSize((s) => s + 1);
  };

  return {
    resources: allResources,
    categories,
    pagination,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    size,
  };
}
