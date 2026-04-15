import useSWR from 'swr';
import {
  crmControllerGetAppointmentDashboard,
  crmControllerCancelAppointment,
  crmControllerGetMediums,
} from '@/sdk/backend-v2';
import { appointmentsKey } from '@/lib/swr-keys';
import { useAuth } from '@/hooks/shared/auth/use-auth';

// Re-export the same AppointmentDetail shape so components don't need auth-and-crm
export type AppointmentDetail = {
  id: number;
  doctor: [number | string, number | string];
  doctor_image_url: string;
  start_datetime: string;
  stop_datetime: string;
  speciality_id: [number | string, number | string];
  consultation_type_ids: [number | string, number | string];
  campus_id: number;
  sub_campus_id: number | false;
  product_id: [number | string, number | string];
  availability: string;
  appointment_type: 'individual_appointment' | 'from_packaage';
  booked_package_name: number | false;
  virtual_consultation_url: string | false;
};

function parseAppointment(raw: string): AppointmentDetail | null {
  try {
    return JSON.parse(raw) as AppointmentDetail;
  } catch {
    return null;
  }
}

function isUpcoming(apt: AppointmentDetail): boolean {
  const status = apt.availability?.toLowerCase();
  if (status === 'cancelled' || status === 'completed') return false;
  return new Date(apt.start_datetime) >= new Date();
}

export function useAppointments() {
  const { user } = useAuth();
  const phone = (
    ((user as Record<string, unknown>)?.caller_mobile as string | undefined) ??
    ((user as Record<string, unknown>)?.phone_number as string | undefined)
  )?.replace(/\D/g, '') ?? null;

  const { data, error, isLoading, mutate } = useSWR<{ upcoming: AppointmentDetail[]; past: AppointmentDetail[] }>(
    phone ? appointmentsKey() : null,
    async () => {
      const res = await crmControllerGetAppointmentDashboard({ query: { phoneNumber: phone! } });
      const raw = (res.data as { appointments?: Array<string> } | undefined)?.appointments ?? [];
      const all = raw.map(parseAppointment).filter((a): a is AppointmentDetail => a !== null);
      return {
        upcoming: all.filter(isUpcoming).sort(
          (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
        ),
        past: all.filter((a) => !isUpcoming(a)).sort(
          (a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()
        ),
      };
    }
  );

  return {
    upcoming: data?.upcoming ?? [],
    past: data?.past ?? [],
    isLoading,
    error,
    mutate,
  };
}

export async function cancelAppointment(appointmentId: number, reason: string): Promise<void> {
  await crmControllerCancelAppointment({ body: { appointment_id: appointmentId, reason } });
}

export async function getMediums(): Promise<Array<{ id: number; name: string }>> {
  const res = await crmControllerGetMediums();
  return (res.data as Array<{ id: number; name: string }> | undefined) ?? [];
}
