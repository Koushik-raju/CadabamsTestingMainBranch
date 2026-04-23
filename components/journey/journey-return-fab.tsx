/**
 * FILE: components/journey/journey-return-fab.tsx
 *
 * PURPOSE:
 *   Floating "Return to journey" affordance rendered at the root of the
 *   authed app. Only appears once a journey task has been marked
 *   complete — i.e. on the task's end/report page — so the user can
 *   hop back to the journey details view without manual navigation.
 *
 * LOGIC OVERVIEW:
 *   Reads the journey-return context. Renders nothing until the context
 *   is hydrated, when there is no active slot, while the task is still
 *   in-progress (the CTA is meant to surface only on task end/summary
 *   pages after completion), or when the user is already on a
 *   /journeys/* route (the in-page UI is sufficient). Completed →
 *   banner with proof preview, +10 XP nudge, and a primary CTA that
 *   routes to the journey details page.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyReturnFab — default export, no props, consumes context only
 *
 * DEPENDENCIES:
 *   useJourneyReturn — contexts/journey-return-context
 *   next/navigation useRouter, usePathname
 *   shadcn Button — components/ui/button
 *
 * LAST UPDATED: 2026-04-22 — initial creation.
 */
"use client";

import { Button } from "@/components/ui/button";
import { useJourneyReturn } from "@/contexts/journey-return-context";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function JourneyReturnFab() {
  const { state, hydrated, clear } = useJourneyReturn();
  const router = useRouter();
  const pathname = usePathname();

  if (!hydrated || !state) return null;
  // Hide on the journeys list and the journey landing/details pages
  // (in-page UI already covers the affordance there) but allow the FAB
  // on task destinations that happen to live under /journeys/* such as
  // /journeys/mood-check.
  const hideOnJourneyOwnPages =
    pathname === "/journeys" ||
    /^\/journeys\/[^/]+$/.test(pathname ?? "") ||
    /^\/journeys\/[^/]+\/details$/.test(pathname ?? "");
  if (hideOnJourneyOwnPages) return null;
  // Only surface the CTA after the task has been marked complete — the
  // in-progress state is tracked so downstream task pages can flip it,
  // but we avoid cluttering unrelated screens with a "return" pill.
  if (state.status !== "completed") return null;

  function goBack() {
    if (!state) return;
    const target = `/journeys/${state.journeyId}/details`;
    clear();
    router.push(target);
  }

  return (
    <div className="fixed bottom-24 right-4 left-4 z-[100] sm:left-auto sm:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-xl shadow-emerald-500/30">
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{state.taskTitle ?? "Task complete"}</p>
            {state.proofPreview ? (
              <p className="mt-0.5 truncate text-xs text-white/85">{state.proofPreview}</p>
            ) : null}
            <p className="mt-1 text-xs font-medium text-white/90">+10 XP earned</p>
          </div>
          <button
            type="button"
            onClick={() => clear()}
            aria-label="Dismiss"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/90 hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative mt-3">
          <Button onClick={goBack} className="w-full bg-white text-emerald-700 hover:bg-white/90">
            Return to journey
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default JourneyReturnFab;
