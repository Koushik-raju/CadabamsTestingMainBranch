/**
 * FILE: hooks/use-journaling-subscriptions.ts
 *
 * PURPOSE:
 *   SWR hooks and mutation helpers for the journal subscription feature.
 *   Covers subscription state, streak/calendar data, sub-journal detail,
 *   and per-journal entry history.
 *
 * LOGIC OVERVIEW:
 *   useJournalingSubscriptions()  — fetches full list of the user's subscriptions;
 *     exposes isSubscribed(slug) helper for O(1) lookup on any page.
 *   useSubJournalDetail(slug)     — fetches SubJournalDetailResponseDto by slug.
 *   useJournalingStreak(slug)     — fetches streak + weekDays; only fetches when
 *     subscribed (key is null otherwise).
 *   useSubJournalEntries(slug)    — fetches the user's entries for one journal.
 *   subscribeToJournal(slug)      — POST subscription; revalidates the list.
 *   unsubscribeFromJournal(slug)  — DELETE subscription; revalidates the list.
 *
 *   All fetchers use the async res.data extraction pattern: await the SDK call,
 *   throw on res.error so SWR enters error state, return res.data directly.
 *   SWR `data` therefore holds the unwrapped payload (not the { data, error } wrapper).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   SubscriptionWithTitleResponseDto — shape of each item in the subscription list
 *   SubJournalDetailResponseDto      — full detail shape (title, tags, description…)
 *   StreakResponseDto                — { currentStreak, longestStreak, totalEntries, weekDays }
 *   SubJournalEntryDto               — single journal entry shape
 *
 * DEPENDENCIES:
 *   journalingSubscriptionsControllerListSubscriptions — list subscriptions
 *   journalingSubscriptionsControllerSubscribe         — subscribe
 *   journalingSubscriptionsControllerUnsubscribe       — unsubscribe
 *   journalingSubscriptionsControllerGetStreak         — streak data
 *   journalingSubscriptionsControllerGetSubJournal     — sub-journal detail by slug
 *   journalingSubscriptionsControllerGetSubJournalEntries — entries for a journal
 *   SWR (useSWR, globalMutate)
 *
 * LAST UPDATED: 2026-04-17 — Rewritten fetchers to async res.data extraction pattern.
 */
"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { swrConfig } from "@/lib/swr-config";
import {
  journalStreakKey,
  journalSubDetailKey,
  journalSubEntriesKey,
  journalSubscriptionsKey,
} from "@/lib/swr-keys";
import {
  journalingSubscriptionsControllerGetStreak,
  journalingSubscriptionsControllerGetSubJournal,
  journalingSubscriptionsControllerGetSubJournalEntries,
  journalingSubscriptionsControllerListSubscriptions,
  journalingSubscriptionsControllerSubscribe,
  journalingSubscriptionsControllerUnsubscribe,
  type StreakResponseDto,
  type SubJournalDetailResponseDto,
  type SubJournalEntryDto,
  type SubscriptionWithTitleResponseDto,
} from "@/sdk/backend-v2";

export type {
  StreakResponseDto,
  SubJournalDetailResponseDto,
  SubJournalEntryDto,
  SubscriptionWithTitleResponseDto,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** All journals the user is currently subscribed to. */
export function useJournalingSubscriptions() {
  const { data, isLoading, error } = useSWR(
    journalSubscriptionsKey(),
    async () => {
      const res = await journalingSubscriptionsControllerListSubscriptions();
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? null;
    },
    { ...swrConfig },
  );

  const items: SubscriptionWithTitleResponseDto[] = data?.items ?? [];

  const subscribedSlugs = new Set(items.map((s) => s.slug));

  return {
    subscriptions: items,
    isSubscribed: (slug: string) => subscribedSlugs.has(slug),
    isLoading,
    error,
  };
}

/** Full detail for a single sub-journal by slug. */
export function useSubJournalDetail(slug: string | null) {
  const { data, isLoading, error } = useSWR(
    slug ? journalSubDetailKey(slug) : null,
    async () => {
      const res = await journalingSubscriptionsControllerGetSubJournal({ path: { slug: slug! } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? null;
    },
    { ...swrConfig },
  );

  return {
    sub: data ?? null,
    isLoading,
    error,
  };
}

/** Streak + 7-day activity for a subscribed journal. Only fetches when subscribed. */
export function useJournalingStreak(slug: string | null, subscribed: boolean) {
  const { data, isLoading, error } = useSWR(
    slug && subscribed ? journalStreakKey(slug) : null,
    async () => {
      const res = await journalingSubscriptionsControllerGetStreak({ path: { slug: slug! } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? null;
    },
    { ...swrConfig },
  );

  return {
    streak: data ?? null,
    isLoading,
    error,
  };
}

/** User's entries for a specific sub-journal. Only fetches when subscribed. */
export function useSubJournalEntries(slug: string | null, subscribed: boolean) {
  const { data, isLoading, error } = useSWR(
    slug && subscribed ? journalSubEntriesKey(slug) : null,
    async () => {
      const res = await journalingSubscriptionsControllerGetSubJournalEntries({
        path: { slug: slug! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? null;
    },
    { ...swrConfig },
  );

  return {
    entries: (data?.items ?? []) as SubJournalEntryDto[],
    total: data?.total ?? 0,
    isLoading,
    error,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function subscribeToJournal(slug: string): Promise<void> {
  await journalingSubscriptionsControllerSubscribe({ path: { slug } });
  await globalMutate(journalSubscriptionsKey());
}

export async function unsubscribeFromJournal(slug: string): Promise<void> {
  await journalingSubscriptionsControllerUnsubscribe({ path: { slug } });
  await globalMutate(journalSubscriptionsKey());
  await globalMutate(journalStreakKey(slug));
}
