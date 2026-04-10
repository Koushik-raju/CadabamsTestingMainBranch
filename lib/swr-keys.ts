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
