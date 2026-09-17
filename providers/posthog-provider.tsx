/**
 * FILE: providers/posthog-provider.tsx
 *
 * PURPOSE:
 *   Initialises the PostHog analytics client once on mount and wraps the React
 *   tree with PostHog's own context provider so child components can use the
 *   `usePostHog` hook from posthog-js/react.
 *
 * LOGIC OVERVIEW:
 *   1. When NEXT_PUBLIC_POSTHOG_API_KEY is configured, call posthog.init() on
 *      mount with the EU ingestion host and automatic pageview/pageleave capture.
 *      Without a key, render children directly so analytics stays disabled.
 *   2. Renders PHProvider (PostHog's React context) with the posthog client so
 *      descendant components can call usePostHog() if needed.
 *   3. The component is 'use client' — PostHog runs only in the browser, never
 *      during SSR.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   PostHogProvider   — default-like named export; wraps children with analytics context
 *   children          — React subtree to wrap
 *
 * DEPENDENCIES:
 *   posthog-js          — core analytics client
 *   posthog-js/react    — PostHogProvider React context wrapper
 *
 * LAST UPDATED: 2026-09-17 — disable analytics cleanly when no PostHog key is configured
 */
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;

  useEffect(() => {
    if (!apiKey) return;

    /* Initialise exactly once. posthog-js is a singleton — calling init a second
       time on hot-reload in dev is safe; the library guards against double-init. */
    posthog.init(apiKey, {
      api_host: "https://us.i.posthog.com",
      defaults: "2026-01-30",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, [apiKey]);

  if (!apiKey) return children;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
