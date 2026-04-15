import { useAppointments } from './use-appointments-page';
import type { AppointmentDetail } from './use-appointments-page';

export type { AppointmentDetail };

export function useAppointmentDetail(appointmentId: number | string | null) {
  const { upcoming, past, isLoading, error } = useAppointments();

  const id = appointmentId != null ? Number(appointmentId) : null;
  const appointment = id != null
    ? ([...upcoming, ...past].find((a) => a.id === id) ?? null)
    : null;

  return { appointment, isLoading, error };
}
