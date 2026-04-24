/**
 * FILE: app/(auth)/consult/find-therapist/page.tsx
 *
 * PURPOSE:
 *   Route entry point for the find-therapist flow. Renders either the wizard
 *   onboarding view or the therapist list view based on context state.
 *
 * LOGIC OVERVIEW:
 *   - FindTherapistProvider reads ?start=wizard from the URL via useSearchParams.
 *   - useSearchParams requires a Suspense boundary during SSR/static export, so
 *     the provider is wrapped in <Suspense> here at the page level.
 *   - FindTherapistInner reads view from context and delegates to WizardView or ListView.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   FindTherapistPage — default export, the Next.js page component.
 *
 * DEPENDENCIES:
 *   FindTherapistProvider, useFindTherapist — context.tsx
 *   WizardView, ListView — child views
 *
 * LAST UPDATED: 2026-04-24 — wrap provider in Suspense to satisfy useSearchParams boundary requirement.
 */
"use client";

import { FindTherapistProvider, useFindTherapist } from "@/components/find-therapist/context";
import { ListView } from "@/components/find-therapist/list-view";
import { WizardView } from "@/components/find-therapist/wizard-view";
import { Suspense } from "react";

function FindTherapistInner() {
  const { view } = useFindTherapist();
  return view === "wizard" ? <WizardView /> : <ListView />;
}

function FindTherapistContent() {
  return (
    <FindTherapistProvider>
      <FindTherapistInner />
    </FindTherapistProvider>
  );
}

export default function FindTherapistPage() {
  return (
    <Suspense>
      <FindTherapistContent />
    </Suspense>
  );
}
