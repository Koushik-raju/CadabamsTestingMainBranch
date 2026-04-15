import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  crmControllerGetDoctorById,
  crmControllerGetSlots,
  crmControllerGetSlotPrice,
  mastersControllerGetCampuses,
  appointmentsControllerBookIndividual,
} from '@/sdk/backend-v2';
import type { DoctorResponseDto, SlotResponseDto } from '@/sdk/backend-v2';

export type { DoctorResponseDto, SlotResponseDto };

// Campus shape (passthrough from CRM)
export type CampusItem = {
  id: number;
  name: string;
  display_name?: string;
  book_appointment?: boolean;
  area?: Array<[string | number, string | number]>;
  [key: string]: unknown;
};

export function useBookingDoctor(doctorId: number | string | null) {
  const { data, error, isLoading } = useSWR(
    doctorId ? `/doctor/${doctorId}` : null,
    async () => {
      const res = await crmControllerGetDoctorById({ path: { id: Number(doctorId) } });
      return (res.data as DoctorResponseDto | undefined) ?? null;
    }
  );
  return { doctor: data ?? null, isLoading, error };
}

export function useBookingCampuses() {
  const { data, error, isLoading } = useSWR(
    '/campuses/booking',
    async () => {
      const res = await mastersControllerGetCampuses({ path: { campus: 'cadabams' } });
      const raw = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      return (raw as CampusItem[]).filter((c) => c.book_appointment);
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
      return (res.data as SlotResponseDto[] | undefined) ?? [];
    }
  );

  return { slots: data ?? [], isLoading, error, refetch: mutate };
}

export function useBookingSlotPrice(slotId: number | null) {
  const { data, error, isLoading } = useSWR(
    slotId != null ? `/slot-price/${slotId}` : null,
    async () => {
      const res = await crmControllerGetSlotPrice({ path: { id: slotId! } });
      const d = res.data as { price?: number } | undefined;
      return d?.price ?? null;
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
    consultationTypeId?: number;
  }
): Promise<void> {
  await appointmentsControllerBookIndividual({
    path: { campus: 'cadabams', id: slotId },
    body: {
      slotId,
      lead_id: opts?.leadId,
      campus_id: opts?.campusId,
      sub_campus_id: opts?.subCampusId,
      consultation_type_id: opts?.consultationTypeId,
      payment_method: 'online',
    },
  });
}
