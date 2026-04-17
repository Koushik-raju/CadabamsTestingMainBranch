export function doctorKey(id: number | string): string {
  return `/doctors/${id}`;
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

export function doctorAvailabilityKey(id: number | string): string {
  return `/doctor-availability/${id}`;
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

export function journalingCategoriesKey(): string {
  return '/journaling/categories';
}

export function selfJournalingEntriesKey(leadId: number | string): string {
  return `/journaling/self/${leadId}`;
}

export function selfJournalingEntryKey(id: string): string {
  return `/journaling/self/entry/${id}`;
}

export function availablePackagesKey(): string {
  return '/packages/available';
}

export function managedPackagesKey(): string {
  return '/packages/managed';
}

export function packageProductLinesKey(): string {
  return '/packages/product-lines';
}
