export function authMeKey(): string {
  return '/auth/me';
}

export function assessmentsKey(): string {
  return '/assessments';
}

export function assessmentByIdKey(id: number | string): string {
  return `/assessments/${id}`;
}

export function assignedAssessmentsKey(leadId: number | string): string {
  return `/assigned-assessments/${leadId}`;
}

export function assessmentSubmissionsKey(leadId: number | string, assessmentId?: number | string): string {
  return assessmentId !== undefined
    ? `/assessment-submissions/${leadId}/${assessmentId}`
    : `/assessment-submissions/${leadId}`;
}

export function journeyEnrollmentKey(journeyId: number | string): string {
  return `/journey-enrollment/${journeyId}`;
}

export function packagesKey(): string {
  return '/packages';
}

export function packageByIdKey(id: number | string): string {
  return `/packages/${id}`;
}

export function documentsKey(): string {
  return '/documents';
}

export function notificationsKey(): string {
  return '/notifications';
}

export function prescriptionsKey(): string {
  return '/prescriptions';
}

export function leaderboardKey(): string {
  return '/leaderboard';
}

export function selfJournalingKey(): string {
  return '/self-journaling';
}

export function selfJournalingEntryKey(entryId: number | string): string {
  return `/self-journaling/${entryId}`;
}

export function appointmentsKey(): string {
  return '/appointments';
}

export function slotsKey(doctorId: number | string, consultTypeId: number): string {
  return `/slots/${doctorId}/${consultTypeId}`;
}

export function slotPriceKey(slotId: number | string): string {
  return `/slot-price/${slotId}`;
}

export function campusesKey(): string {
  return '/campuses';
}

export function journeysKey(category?: string, search?: string): string {
  const parts = ['/journeys'];
  if (category) parts.push(`cat=${category}`);
  if (search) parts.push(`q=${search}`);
  return parts.join('?');
}

export function journeyDetailKey(id: string): string {
  return `/journeys/${id}`;
}

export function journeyProgressKey(mobile: string, journeyId: string): string {
  return `/journey-progress/${mobile}/${journeyId}`;
}

export function wellnessResourcesKey(
  page: number,
  pageSize: number,
  search: string,
  category: string
): readonly [string, number, number, string, string] {
  return ['/wellness-resources', page, pageSize, search, category] as const;
}

export function wellnessResourceDetailKey(slug: string): string {
  return `/wellness-resources/${slug}`;
}

export function mindfulMinutesKey(): string {
  return '/mindful-minutes';
}

export function mindfulMinuteDetailKey(slugOrId: string): string {
  return `/mindful-minutes/detail/${slugOrId}`;
}

export function videosKey(): string {
  return '/videos';
}

export function videoDetailKey(slug: string): string {
  return `/videos/${slug}`;
}

export function availablePackagesKey(): string {
  return '/packages/available';
}

export function managedPackagesKey(): string {
  return '/packages/managed';
}

export function packageProductLinesKey(packageId?: number): string {
  return packageId ? `/packages/product-lines/${packageId}` : '/packages/product-lines';
}
