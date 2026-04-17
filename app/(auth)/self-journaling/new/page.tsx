/**
 * FILE: app/(auth)/self-journaling/new/page.tsx
 *
 * PURPOSE:
 *   Free-flow journaling entry point. No sub-journal context — the user
 *   writes whatever is on their mind, optionally using AI prompts.
 *
 * LOGIC OVERVIEW:
 *   Renders JournalWriter with no slug so no guided sub-journal is loaded
 *   and no AI prompt is auto-triggered on mount.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   (none — thin wrapper)
 *
 * DEPENDENCIES:
 *   JournalWriter — shared writing component (components/journal/journal-writer.tsx)
 *
 * LAST UPDATED: 2026-04-17 — Refactored to thin wrapper; logic lives in JournalWriter.
 */
import { JournalWriter } from '@/components/journal/journal-writer';

export default function FreeFlowJournalPage() {
  return <JournalWriter />;
}
