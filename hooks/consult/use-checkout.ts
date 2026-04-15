import useSWR from 'swr';
import {
  crmControllerGetDoctorById,
  crmControllerGetSlotPrice,
  appointmentsControllerBookIndividual,
  appointmentsControllerConfirm,
  crmControllerRazorpayPayment,
} from '@/sdk/backend-v2';
import type { DoctorResponseDto, RazorpayPaymentResponseDto } from '@/sdk/backend-v2';

export type { DoctorResponseDto, RazorpayPaymentResponseDto };

export function useCheckoutDoctor(doctorId: number | string | null) {
  const { data, error, isLoading } = useSWR(
    doctorId ? `/doctor/${doctorId}` : null,
    async () => {
      const res = await crmControllerGetDoctorById({ path: { id: Number(doctorId) } });
      return (res.data as DoctorResponseDto | undefined) ?? null;
    }
  );
  return { doctor: data ?? null, isLoading, error };
}

export function useCheckoutSlotPrice(slotId: number | null) {
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

export async function bookAndPay(opts: {
  slotId: number;
  campusId: number;
  subCampusId?: number;
  consultationTypeId?: number;
  leadId: number;
  uid: string;
}): Promise<RazorpayPaymentResponseDto> {
  // Step 1: book the slot
  await appointmentsControllerBookIndividual({
    path: { campus: 'cadabams', id: opts.slotId },
    body: {
      slotId: opts.slotId,
      lead_id: opts.leadId,
      campus_id: opts.campusId,
      sub_campus_id: opts.subCampusId,
      consultation_type_id: opts.consultationTypeId,
      payment_method: 'online',
    },
  });

  // Step 2: initiate Razorpay payment
  const payRes = await crmControllerRazorpayPayment({
    body: {
      slot_id: opts.slotId,
      campus_id: opts.campusId,
      lead_id: opts.leadId,
      uid: opts.uid,
    },
  });
  const payData = payRes.data as RazorpayPaymentResponseDto | undefined;
  if (!payData) throw new Error('Payment initiation failed — no data returned');
  return payData;
}

export async function confirmAppointment(appointmentId: number): Promise<void> {
  await appointmentsControllerConfirm({ path: { campus: 'cadabams', id: appointmentId } });
}
