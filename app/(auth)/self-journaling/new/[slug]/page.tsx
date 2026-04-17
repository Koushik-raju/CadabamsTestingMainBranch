/**
 * FILE: app/(auth)/self-journaling/new/[slug]/page.tsx
 *
 * PURPOSE:
 *   Guided journaling entry point for a specific sub-journal identified by slug.
 *   The slug is read from the route param — no query strings required — making
 *   this URL directly shareable and bookmark-friendly.
 *
 * LOGIC OVERVIEW:
 *   Reads [slug] from Next.js route params and passes it to JournalWriter,
 *   which resolves the sub-journal record (title, aiPrompt, id) independently
 *   via useJournalingCategories().
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   params.slug — route segment identifying the sub-journal
 *
 * DEPENDENCIES:
 *   JournalWriter — shared writing component (components/journal/journal-writer.tsx)
 *
 * LAST UPDATED: 2026-04-17 — Created. Guided path: /self-journaling/new/[slug].
 */
import { JournalWriter } from '@/components/journal/journal-writer';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GuidedJournalPage({ params }: Props) {
  const { slug } = await params;
  return <JournalWriter slug={slug} />;
}
