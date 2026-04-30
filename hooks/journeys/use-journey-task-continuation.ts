/**
 * FILE: hooks/journeys/use-journey-task-continuation.ts
 *
 * PURPOSE:
 *   Ergonomic helper used by task destination pages (assessments,
 *   worksheets, self-journaling, mindful-minutes, etc.) to detect when
 *   they were opened from a journey node and continue that flow.
 *
 * LOGIC OVERVIEW:
 *   Single source of truth: the persisted journey-return context slot
 *   (written by journey-path-view.navigateToTask and hydrated from
 *   localStorage). URL query strings are intentionally NOT consulted —
 *   assessment submission and similar flows often navigate to a new URL
 *   that drops the original params, so they are unreliable.
 *
 *   The optional `expectedKind` arg narrows the match: the continuation
 *   activates only when the stored task kind matches what the page
 *   handles (e.g. 'ASSESSMENT' for the assessment result page). This
 *   prevents an unrelated in-progress slot from being accidentally
 *   flagged as completed by a page it has nothing to do with.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   useJourneyTaskContinuation(expectedKind?) — returns:
 *     active — whether the current page is the end-page of the in-flight task
 *     enrollmentId, taskId, journeyId — from the context slot
 *     markCompleted(proof, extras?) — persists backend completion + FAB flip
 *     returnToJourney() — router.push to /journeys/<id>/details and clear slot
 *
 * DEPENDENCIES:
 *   next/navigation useRouter
 *   useJourneyReturn, JourneyReturnTaskKind — contexts/journey-return-context
 *   updateNodeProgress, TaskProof — hooks/journeys/use-journey-detail
 *
 * LAST UPDATED: 2026-04-30 — markCompleted now clears the persisted slot when
 *   the backend reports a 404 "Journey enrollment not found", so a stale slot
 *   left over from a prior session can't keep firing on unrelated pages
 *   (e.g. free-flow journal saves opened directly from /self-journaling).
 */
"use client";

import { type JourneyReturnTaskKind, useJourneyReturn } from "@/contexts/journey-return-context";
import { type TaskProof, updateNodeProgress } from "@/hooks/journeys/use-journey-detail";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useJourneyTaskContinuation(expectedKind?: JourneyReturnTaskKind) {
  const router = useRouter();
  const { state, markCompleted, clear } = useJourneyReturn();

  /*
   * Detects a stale slot: backend says the enrollment we have stored no longer
   * exists. Happens when the user previously opened a journey task, the slot
   * persisted to localStorage, but the enrollment was deleted/reset before the
   * user returned to finish the task. Match on the 404 + "Journey enrollment
   * not found" payload thrown by updateNodeProgress.
   */
  const isStaleEnrollmentError = (err: unknown): boolean => {
    if (!(err instanceof Error)) return false;
    return (
      err.message.includes('"statusCode":404') &&
      err.message.includes("Journey enrollment not found")
    );
  };

  // Active when there is an unfinished slot and — if the page specified
  // what kind it handles — the slot's kind matches.
  const kindOk = expectedKind == null || state?.taskKind === expectedKind;
  const active = !!state && state.status !== "completed" && kindOk;

  const enrollmentId = active ? state!.enrollmentId : null;
  const taskId = active ? state!.taskId : null;
  const journeyId = active ? state!.journeyId : null;

  const handleCompleted = useCallback(
    async (proof: TaskProof, extras?: { proofPreview?: string }) => {
      if (!active || !enrollmentId || !taskId || !journeyId) return;
      try {
        await updateNodeProgress(enrollmentId, journeyId, taskId, proof);
      } catch (err) {
        /*
         * Stale slot recovery: the enrollment is gone, so this slot can never
         * succeed. Drop it from localStorage so subsequent saves on unrelated
         * pages (e.g. free-flow journaling opened directly from /self-journaling)
         * don't keep firing the same 404. Then rethrow so the caller knows the
         * journey-completion path failed and routes to its normal destination
         * instead of returnToJourney().
         */
        if (isStaleEnrollmentError(err)) {
          clear();
        }
        throw err;
      }
      markCompleted({ proofPreview: extras?.proofPreview });
    },
    [active, enrollmentId, taskId, journeyId, markCompleted, clear],
  );

  const returnToJourney = useCallback(() => {
    if (!journeyId) return;
    clear();
    router.push(`/journeys/${journeyId}/details`);
  }, [journeyId, clear, router]);

  return useMemo(
    () => ({
      active,
      enrollmentId,
      taskId,
      journeyId,
      markCompleted: handleCompleted,
      returnToJourney,
    }),
    [active, enrollmentId, taskId, journeyId, handleCompleted, returnToJourney],
  );
}
