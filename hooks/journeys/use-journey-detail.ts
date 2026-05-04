/**
 * FILE: hooks/journeys/use-journey-detail.ts
 *
 * PURPOSE:
 *   SWR hooks and action helpers for a single journey's CMS content, the
 *   user's enrollment record, the list of all enrollments, and gamification.
 *   All business logic (unlock timing, streaks, XP) lives on the server —
 *   this file just wraps SDK calls and manages SWR cache.
 *
 * LOGIC OVERVIEW:
 *   useJourneyDetail(id)     — fetches CMS journey structure
 *   useJourneyProgress(id)   — returns the raw PatientJourneyResponseDto; always
 *                              passes preview=true so GET never auto-enrolls
 *   useEnrolledJourneys()    — lists all PatientJourneyResponseDto for the user
 *   useGamification()        — fetches GamificationDto (streak, xp, …)
 *   subscribeToJourney()     — auto-enroll free journeys via GET; throws for premium (purchase package instead)
 *   tickJourney()            — POST tick; server idempotently advances the day
 *   updateNodeProgress()     — POST complete-task; server returns the full
 *                              enrollment which replaces the SWR cache 1:1
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyProgress          — alias for PatientJourneyResponseDto
 *   CAMPUS                   — hard-coded campus slug
 *   getDaySummary            — async helper that fetches DaySummaryResponseDto for a given enrollment + day
 *
 * DEPENDENCIES:
 *   cmsJourneysControllerGetById
 *   journeysControllerListMine / GetByJourneyId / Enroll
 *   journeysControllerCompleteTask / Tick
 *   journeysControllerGetMyGamification
 *   journeysControllerGetDaySummary
 *   SWR (useSWR, globalMutate)
 *
 * LAST UPDATED: 2026-04-23 — subscribeToJourney now throws for premium journeys (backend returns 402); removed dead enrollAPI branch
 *   discriminated union and forwards the proof id to the backend. The server
 *   rejects completion when the proof is missing, belongs to another patient,
 *   or does not match the content linked to the task. Added completeJourneyDay
 *   helper so the day-summary sheet can persist mood + summary on Day Done.
 */
import useSWR, { mutate as globalMutate } from "swr";
import {
  enrolledJourneysKey,
  gamificationKey,
  journeyDetailKey,
  journeyEnrollmentKey,
} from "@/lib/swr-keys";
import type {
  DaySummaryResponseDto,
  GamificationDto,
  PatientJourneyResponseDto,
} from "@/sdk/backend-v2";
import {
  cmsJourneysControllerGetById,
  journeysControllerCompleteDay,
  journeysControllerCompleteTask,
  journeysControllerGetByJourneyId,
  journeysControllerGetDaySummary,
  journeysControllerGetMyGamification,
  journeysControllerListMine,
  journeysControllerTick,
} from "@/sdk/backend-v2";
import type { JourneyItem } from "@/types/journey";
import { mapV2Journey } from "./use-journeys-page";

export type JourneyProgress = PatientJourneyResponseDto;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useJourneyDetail(id: string | null) {
  const key = id ? journeyDetailKey(id) : null;

  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      console.log("[useJourneyDetail] FETCH start", { id });
      const res = await cmsJourneysControllerGetById({ path: { id: id! } });
      console.log("[useJourneyDetail] FETCH result", {
        hasError: !!res.error,
        hasData: !!res.data,
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ? mapV2Journey(res.data) : null;
    },
    { revalidateOnFocus: false, revalidateIfStale: false },
  );

  return { journey: (data ?? null) as JourneyItem | null, isLoading, error };
}

export function useJourneyProgress(journeyId: string | null) {
  const key = journeyId ? journeyEnrollmentKey(journeyId) : null;

  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      console.log("[useJourneyProgress] FETCH start", { journeyId, key });
      const res = await journeysControllerGetByJourneyId({
        path: { journeyId: journeyId! },
        query: { preview: true },
      });
      console.log("[useJourneyProgress] FETCH result", {
        hasError: !!res.error,
        hasData: !!res.data,
        errorShape: res.error ? Object.keys(res.error as object) : null,
        errorRaw: res.error,
        responseStatus: (res as { response?: { status?: number } }).response?.status,
        topStatus: (res as { status?: number }).status,
      });
      if (res.error) {
        const status =
          (res as { response?: { status?: number }; status?: number }).response?.status ??
          (res as { status?: number }).status ??
          (res.error as { statusCode?: number; status?: number })?.statusCode ??
          (res.error as { statusCode?: number; status?: number })?.status;
        console.log("[useJourneyProgress] extracted status", status);
        if (status === 404) {
          console.log("[useJourneyProgress] 404 → return null");
          return null;
        }
        console.error("[useJourneyProgress] throwing error");
        throw new Error(JSON.stringify(res.error));
      }
      console.log("[useJourneyProgress] returning data", { id: res.data?.id });
      return res.data ?? null;
    },
    { revalidateOnFocus: false },
  );

  return { progress: data ?? null, isLoading, error };
}

export function useEnrolledJourneys() {
  const { data, isLoading, error } = useSWR(
    enrolledJourneysKey(),
    async () => {
      const res = await journeysControllerListMine();
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data?.items ?? [];
    },
    { revalidateOnFocus: false },
  );
  return { enrollments: data ?? [], isLoading, error };
}

export function useGamification() {
  const { data, isLoading, error } = useSWR<GamificationDto | null>(
    gamificationKey(),
    async () => {
      const res = await journeysControllerGetMyGamification();
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? null;
    },
    { revalidateOnFocus: false },
  );
  return { gamification: data ?? null, isLoading, error };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function replaceCache(journeyId: string, enrollment: PatientJourneyResponseDto) {
  await globalMutate(journeyEnrollmentKey(journeyId), enrollment, { revalidate: false });
  // Enrollment list and gamification may have changed — refresh in background.
  globalMutate(enrolledJourneysKey());
  globalMutate(gamificationKey());
  // Growth page reads JourneyDayProgress + JourneyTaskCompletion. A day or
  // task completion mutates those, so every cached growth-week / growth-day
  // / growth-latest-active-date entry must refetch — otherwise the user
  // sees a stale Growth feed after just finishing a journey day.
  globalMutate(
    (key) =>
      Array.isArray(key) &&
      typeof key[0] === "string" &&
      (key[0] === "growth-week" || key[0] === "growth-day"),
    undefined,
    { revalidate: true },
  );
  globalMutate("growth-latest-active-date");
}

/**
 * Auto-enroll in a free journey via a non-preview GET. Premium journeys are
 * purchased through the package flow — calling this for a premium journey is
 * a programming error; the backend returns 402.
 */
export async function subscribeToJourney(journey: JourneyItem): Promise<void> {
  if (journey.isPremium) {
    throw new Error("Purchase the package to get access — you will be auto-subscribed.");
  }
  // Backend rejects the enroll POST for free journeys — a non-preview GET
  // triggers auto-enrollment server-side.
  const res = await journeysControllerGetByJourneyId({
    path: { journeyId: journey.id },
    query: { preview: false },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (res.data) await replaceCache(journey.id, res.data);
  else await globalMutate(journeyEnrollmentKey(journey.id));
}

/** Idempotent server-driven day advance. Safe to call on mount / focus. */
export async function tickJourney(enrollmentId: string, journeyId: string): Promise<void> {
  console.log("[tickJourney] CALL", { enrollmentId, journeyId });
  const res = await journeysControllerTick({
    path: { id: enrollmentId },
  });
  console.log("[tickJourney] result", { hasError: !!res.error, hasData: !!res.data });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (res.data) await replaceCache(journeyId, res.data);
}

/**
 * Proof payload forwarded to the backend alongside a completeTask call. The
 * backend verifies the id exists, belongs to the caller, and (where
 * applicable) matches the CMS content linked to the task.
 */
export type TaskProof =
  | { kind: "ASSESSMENT"; assessmentCompletionId: string }
  | { kind: "WORKSHEET"; worksheetSubmissionId: string }
  | { kind: "SUB_JOURNAL"; journalEntryId?: string }
  | { kind: "JOURNAL"; journalEntryId?: string }
  | { kind: "AUDIO"; audioId: string }
  | { kind: "VIDEO"; videoId: string }
  | { kind: "MOOD"; moodBefore: number; moodAfter: number }
  | { kind: "APPOINTMENT" | "CONSULT_BOOKING"; appointmentId: string }
  | { kind: "READ" | "OTHER"; note: string };

function proofToBody(proof: TaskProof): Record<string, unknown> {
  switch (proof.kind) {
    case "ASSESSMENT":
      return { assessmentCompletionId: proof.assessmentCompletionId };
    case "WORKSHEET":
      return { worksheetSubmissionId: proof.worksheetSubmissionId };
    case "SUB_JOURNAL":
      return {
        ...(proof.journalEntryId ? { journalEntryId: proof.journalEntryId } : {}),
      };
    case "JOURNAL":
      return {
        ...(proof.journalEntryId ? { journalEntryId: proof.journalEntryId } : {}),
      };
    case "AUDIO":
      return { audioId: proof.audioId };
    case "VIDEO":
      return { videoId: proof.videoId };
    case "MOOD":
      return { moodBefore: proof.moodBefore, moodAfter: proof.moodAfter };
    case "APPOINTMENT":
    case "CONSULT_BOOKING":
      return { appointmentId: proof.appointmentId };
    case "READ":
    case "OTHER":
      return { note: proof.note };
  }
}

/** Mark a task done with a proof id. `taskId` is the plain CmsJourneyStepTask.id. */
export async function updateNodeProgress(
  enrollmentId: string,
  journeyId: string,
  taskId: string,
  proof: TaskProof,
): Promise<void> {
  const res = await journeysControllerCompleteTask({
    path: { id: enrollmentId },
    body: { taskId, ...proofToBody(proof) },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (res.data?.enrollment) await replaceCache(journeyId, res.data.enrollment);
}

/** Persist day completion with optional mood + summary. */
export async function completeJourneyDay(
  enrollmentId: string,
  journeyId: string,
  dayNumber: number,
  extras: { moodBefore?: number; moodAfter?: number; summary?: string } = {},
): Promise<void> {
  const res = await journeysControllerCompleteDay({
    path: { id: enrollmentId },
    body: { dayNumber, ...extras },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (res.data?.enrollment) await replaceCache(journeyId, res.data.enrollment);
}

/** Fetch the server-generated day summary for a completed day. Returns null on error. */
export async function getDaySummary(
  enrollmentId: string,
  day: number,
): Promise<DaySummaryResponseDto | null> {
  const res = await journeysControllerGetDaySummary({
    path: { id: enrollmentId },
    query: { day },
  });
  if (res.error) return null;
  return res.data ?? null;
}
