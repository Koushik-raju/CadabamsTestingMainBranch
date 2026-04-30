/**
 * FILE: app/(auth)/self-journaling/new/page.tsx
 *
 * PURPOSE:
 *   Free-flow self-journaling entry route (no slug). Client component that
 *   renders the shared JournalWriter so this route has parity with the
 *   slug-based variant (`/self-journaling/new/[slug]`).
 *
 * LOGIC OVERVIEW:
 *   1. Client component ("use client") — JournalWriter relies on client-only
 *      hooks (useRouter, useSearchParams, useState, sessionStorage).
 *   2. Mounts <JournalWriter /> with no `slug` prop, which triggers its
 *      free-flow mode (single "Prompt Me" CTA, no auto-prompt unless an
 *      active journey task is in continuation state).
 *   3. All AI prompt fetching, prompt accumulation, save, and navigation
 *      are handled inside JournalWriter via the SDK.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   FreeFlowJournalPage — default export; route entry for /self-journaling/new
 *
 * DEPENDENCIES:
 *   JournalWriter (components/journal/journal-writer)
 *
 * LAST UPDATED: 2026-04-30 — converted to client component; replaced legacy
 *   JournalEditor implementation with shared JournalWriter.
 */
"use client";

import { JournalWriter } from "@/components/journal/journal-writer";

export default function FreeFlowJournalPage() {
  return <JournalWriter />;
}
