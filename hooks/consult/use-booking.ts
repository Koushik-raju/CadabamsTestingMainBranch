import { useCallback } from 'react';
import useSWR from 'swr';
import {
  crmControllerGetDoctorById,
  crmControllerGetSlots,
  crmControllerGetSlotPrice,
  crmControllerGetCampuses,
  crmControllerBookAppointment,
} from '@/sdk/backend-v2';
import type { DoctorListingResponseDto, CampusMasterResponseDto, SlotResponseDto } from '@/sdk/backend-v2';

export type { DoctorListingResponseDto, SlotResponseDto };

// CampusMasterResponseDto extended with extra fields the API sends that aren't yet in the SDK type
export type CampusItem = CampusMasterResponseDto & {
  display_name?: string;
  area?: Array<[string | number, string | number]>;
};

export function useBookingDoctor(doctorId: number | string | null) {
  const { data, error, isLoading } = useSWR(
    doctorId ? `/doctor/${doctorId}` : null,
    async () => {
      const res = await crmControllerGetDoctorById({ path: { id: Number(doctorId) } });
      return res.data ?? null;
    }
  );
  return { doctor: data ?? null, isLoading, error };
}

export function useBookingCampuses() {
  const { data, error, isLoading } = useSWR(
    '/campuses/booking',
    async () => {
      const res = await crmControllerGetCampuses({});
      return (res.data ?? []).filter((c) => c.book_appointment) as CampusItem[];
    }
  );
  return { campuses: data ?? [], isLoading, error };
}

export function useBookingSlots(
  doctorId: number | string | null,
  startDate: Date | null,
  endDate: Date | null,
  consultationTypeId: number
) {
  const enabled = !!(doctorId && startDate && endDate);
  const key = enabled
    ? `/slots/${doctorId}/${consultationTypeId}/${startDate?.toISOString()}/${endDate?.toISOString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<SlotResponseDto[]>(
    key,
    async () => {
      const res = await crmControllerGetSlots({
        query: {
          doctor_id: Number(doctorId),
          availability: 'open',
        },
      });
      return res.data ?? [];
    }
  );

  return { slots: data ?? [], isLoading, error, refetch: mutate };
}

export function useBookingSlotPrice(slotId: number | null) {
  const { data, error, isLoading } = useSWR(
    slotId != null ? `/slot-price/${slotId}` : null,
    async () => {
      const res = await crmControllerGetSlotPrice({ path: { id: slotId! } });
      return res.data?.price ?? null;
    }
  );
  return { price: data ?? null, isLoading, error };
}

export async function bookIndividualSlot(
  slotId: number,
  opts?: {
    leadId?: number;
    campusId?: number;
    subCampusId?: number;
    consultationTypeId?: 1 | 2 | 3;
    callerName?: string;
    patientName?: string;
  }
): Promise<void> {
  await crmControllerBookAppointment({
    body: {
      slot_id: slotId,
      lead_id: opts?.leadId ?? 0,
      campus_id: opts?.campusId ?? 0,
      sub_campus_id: opts?.subCampusId,
      consultation_type_id: opts?.consultationTypeId ?? 1,
      caller_name: opts?.callerName ?? '',
      patient_name: opts?.patientName ?? '',
      appointment_type: 'individual_appointment',
      payment_mode: 'online',
    },
  });
}
