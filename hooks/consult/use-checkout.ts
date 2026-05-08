import useSWR from "swr";
import type {
  DoctorListingResponseDto,
  RazorpayOrderResponseDto,
  RazorpayPaymentResponseDto,
} from "@/sdk/backend-v2";
import {
  crmControllerBookAppointment,
  crmControllerGetDoctorById,
  crmControllerGetSlotPrice,
  crmControllerRazorpayOrder,
  crmControllerRazorpayPayment,
} from "@/sdk/backend-v2";

export type { DoctorListingResponseDto, RazorpayOrderResponseDto, RazorpayPaymentResponseDto };

export function useCheckoutDoctor(doctorId: number | string | null) {
  const { data, error, isLoading } = useSWR(doctorId ? `/doctor/${doctorId}` : null, async () => {
    const res = await crmControllerGetDoctorById({ path: { id: Number(doctorId) } });
    return res.data ?? null;
  });
  return { doctor: data ?? null, isLoading, error };
}

export function useCheckoutSlotPrice(slotId: number | null) {
  const { data, error, isLoading } = useSWR(
    slotId != null ? `/slot-price/${slotId}` : null,
    async () => {
      const res = await crmControllerGetSlotPrice({ path: { id: slotId! } });
      return res.data?.price ?? null;
    },
  );
  return { price: data ?? null, isLoading, error };
}

export async function bookAndPay(opts: {
  slotId: number;
  campusId: number;
  subCampusId?: number;
  consultationTypeId?: 1 | 2 | 3;
  leadId: number;
  uid: string;
  callerName: string;
  patientName: string;
}): Promise<RazorpayPaymentResponseDto> {
  await crmControllerBookAppointment({
    body: {
      slot_id: opts.slotId,
      lead_id: opts.leadId,
      campus_id: opts.campusId,
      sub_campus_id: opts.subCampusId,
      consultation_type_id: opts.consultationTypeId ?? 1,
      caller_name: opts.callerName,
      patient_name: opts.patientName,
      appointment_type: "individual_appointment",
      payment_mode: "online",
    },
  });

  const payRes = await crmControllerRazorpayPayment({
    body: {
      slot_id: opts.slotId,
      campus_id: opts.campusId,
      lead_id: opts.leadId,
      uid: opts.uid,
    },
  });

  if (!payRes.data?.result) throw new Error("Payment initiation failed — no data returned");
  return payRes.data.result;
}

/*
 * New flow: books the appointment, then creates a Razorpay Order via
 * /crm/payments/razorpay-order. The returned order_id is fed into
 * Razorpay Standard Checkout. expiry_date is Unix SECONDS, not ms.
 */
export async function bookAndCreateOrder(opts: {
  slotId: number;
  campusId: number;
  subCampusId?: number;
  consultationTypeId?: 1 | 2 | 3;
  leadId: number;
  callerName: string;
  patientName: string;
  expirySeconds?: number;
}): Promise<RazorpayOrderResponseDto> {
  await crmControllerBookAppointment({
    body: {
      slot_id: opts.slotId,
      lead_id: opts.leadId,
      campus_id: opts.campusId,
      sub_campus_id: opts.subCampusId,
      consultation_type_id: opts.consultationTypeId ?? 1,
      caller_name: opts.callerName,
      patient_name: opts.patientName,
      appointment_type: "individual_appointment",
      payment_mode: "online",
    },
  });

  const expiryDate = opts.expirySeconds ?? Math.floor(Date.now() / 1000) + 86400;
  const orderRes = await crmControllerRazorpayOrder({
    body: {
      lead_id: opts.leadId,
      slot_id: opts.slotId,
      expiry_date: expiryDate,
    },
  });

  if (!orderRes.data?.result) throw new Error("Order creation failed — no data returned");
  return orderRes.data.result;
}
