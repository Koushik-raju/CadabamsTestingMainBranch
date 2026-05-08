/**
 * FILE: lib/swr-keys.ts
 *
 * PURPOSE:
 *   Centralised factory for all SWR cache keys used across the app.
 *   Keeping keys in one place prevents typo-driven cache mismatches and
 *   makes it easy to grep for every consumer of a given endpoint.
 *
 * LOGIC OVERVIEW:
 *   Each exported function returns a stable string (or tuple) that SWR uses
 *   as the deduplication/cache key for a given resource. Parameterised keys
 *   embed IDs so separate resources get separate cache slots.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   baselineAssessmentMyKey() — key for the current user's baseline assessment list
 *   enrolledJourneysKey()    — key for the current user's journey enrollments list
 *   availablePackagesKey()   — key for the browsable package catalogue
 *   managedPackagesKey()     — key for the user's purchased packages
 *   threadsKey(resourceId)   — key for the user's chat thread list
 *   (all other keys)         — see individual function names
 *
 * DEPENDENCIES:
 *   None — pure string-returning functions, no imports.
 *
 * LAST UPDATED: 2026-04-24 — removed wellnessResourcesKey, wellnessResourceDetailKey, videosKey, videoDetailKey (features deleted)
 */
export function authMeKey(): string {
  return "/auth/me";
}

export function assessmentsKey(): string {
  return "/assessments";
}

export function worksheetsKey(): string {
  return "/worksheets";
}

export function worksheetByIdKey(id: number | string): string {
  return `/worksheets/${id}`;
}

export function worksheetSubmissionsKey(worksheetId: number | string): string {
  return `/worksheet-submissions/me/${worksheetId}`;
}

export function worksheetSubmissionByIdKey(submissionId: string): string {
  return `/worksheet-submission/${submissionId}`;
}

export function assignedWorksheetsKey(leadId: number | string): string {
  return `/assigned-worksheets/${leadId}`;
}

export function assessmentByIdKey(id: number | string): string {
  return `/assessments/${id}`;
}

/** Raw GET /api/v1/{campus}/patient/assigned-content — shared by assessments + journeys. */
export function patientAssignedContentKey(leadId: number | string): string {
  return `/patient-assigned-content/${leadId}`;
}

export function assignedAssessmentsKey(leadId: number | string): string {
  return patientAssignedContentKey(leadId);
}

export function assessmentSubmissionsKey(
  leadId: number | string,
  assessmentId?: number | string,
): string {
  return assessmentId !== undefined
    ? `/assessment-submissions/${leadId}/${assessmentId}`
    : `/assessment-submissions/${leadId}`;
}

export function assessmentReportsKey(assessmentId: number | string): string {
  return `/assessment-reports/${assessmentId}`;
}

export function completionByIdKey(completionId: string): string {
  return `/assessment-completions/${completionId}`;
}

export function journeyEnrollmentKey(journeyId: number | string): string {
  return `/journey-enrollment/${journeyId}`;
}

export function gamificationKey(): string {
  return "/me/gamification";
}

export function packagesKey(): string {
  return "/packages";
}

export function packageByIdKey(id: number | string): string {
  return `/packages/${id}`;
}

export function documentsKey(): string {
  return "/documents";
}

export function notificationsKey(): string {
  return "/notifications";
}

export function prescriptionsKey(): string {
  return "/prescriptions";
}

export function leaderboardKey(): string {
  return "/leaderboard";
}

export function selfJournalingKey(): string {
  return "/self-journaling";
}

export function appointmentsKey(): string {
  return "/appointments";
}

export function slotsKey(doctorId: number | string, consultTypeId: number): string {
  return `/slots/${doctorId}/${consultTypeId}`;
}

export function slotPriceKey(slotId: number | string): string {
  return `/slot-price/${slotId}`;
}

export function campusesKey(): string {
  return "/campuses";
}

export function journeysKey(category?: string, search?: string): string {
  const parts = ["/journeys"];
  if (category) parts.push(`cat=${category}`);
  if (search) parts.push(`q=${search}`);
  return parts.join("?");
}

export function journeyDetailKey(id: string): string {
  return `/journeys/${id}`;
}

export function journeyProgressKey(mobile: string, journeyId: string): string {
  return `/journey-progress/${mobile}/${journeyId}`;
}

export function mindfulMinutesKey(): string {
  return "/mindful-minutes";
}

export function mindfulMinuteDetailKey(slugOrId: string): string {
  return `/mindful-minutes/detail/${slugOrId}`;
}

export function journalingCategoriesKey(): string {
  return "/journaling/categories";
}

export function selfJournalingEntriesKey(leadId: number | string): string {
  return `/journaling/self/${leadId}`;
}

export function selfJournalingEntryKey(id: string): string {
  return `/journaling/self/entry/${id}`;
}

export function availablePackagesKey(): string {
  return "/packages/available";
}

export function managedPackagesKey(): string {
  return "/packages/managed";
}

export function packageProductLinesKey(packageId?: number): string {
  return packageId ? `/packages/product-lines/${packageId}` : "/packages/product-lines";
}

export function packageProductDetailsKey(packageId: number): string {
  return `/packages/${packageId}/details`;
}

export function enrolledJourneysKey(): string {
  return "/journeys/enrolled";
}

export function threadsKey(resourceId: string): readonly ["threads", string] {
  return ["threads", resourceId] as const;
}

export function journalSubscriptionsKey(): string {
  return "/journaling/subscriptions";
}

export function journalSubDetailKey(slug: string): string {
  return `/journaling/sub-journalings/${slug}`;
}

export function journalStreakKey(slug: string): string {
  return `/journaling/subscriptions/${slug}/streak`;
}

export function journalSubEntriesKey(slug: string): string {
  return `/journaling/sub-journalings/${slug}/entries`;
}

export function baselineAssessmentMyKey(): string {
  return "/me/baseline-assessment";
}

export function growthWeekKey(date: string): readonly ["growth-week", string] {
  return ["growth-week", date] as const;
}

export function growthDayKey(date: string): readonly ["growth-day", string] {
  return ["growth-day", date] as const;
}
