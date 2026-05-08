/**
 * FILE: hooks/appointments/use-appointments-page.ts
 *
 * PURPOSE:
 *   SWR hooks for fetching and managing appointment data. Provides upcoming
 *   and past appointments separated by status, plus cancellation actions.
 *
 * LOGIC OVERVIEW:
 *   useAppointments()    — SWR hook that fetches appointments with a 1-year
 *                          lookback. Disables fetch when leadId is missing.
 *                          Derives upcoming and past arrays via filtering
 *                          and sorting server-side results. Returns mutate
 *                          for manual cache invalidation.
 *   useAppointmentById() — SWR hook for a single appointment lookup; uses
 *                          global fetch but filters client-side.
 *   cancelAppointment    — async action that calls the cancel SDK function.
 *                          Caller is responsible for calling mutate() to
 *                          invalidate caches.
 *   startConsultAppointmentPayment — creates a Razorpay Order for an already-
 *                          booked slot. Returns RazorpayOrderResponseDto so the
 *                          caller can open Razorpay Standard Checkout in-page.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   ONE_YEAR_AGO        — module-level date string; fixed so SWR key doesn't
 *                         change on every render
 *   isUpcoming()        — predicate: not cancelled/completed AND in future
 *   appointmentsKey()   — from @/lib/swr-keys; cache key factory
 *
 * DEPENDENCIES:
 *   SWR (useSWR, useSWRConfig)
 *   crmControllerFetchAppointmentDetails, crmControllerCancelAppointment,
 *   crmControllerRazorpayOrder (via startConsultAppointmentPayment)
 *   appointmentsKey — from @/lib/swr-keys
 *   useAuth — for leadId
 *
 * LAST UPDATED: 2026-05-08 — Migrated startConsultAppointmentPayment from payment-link to Razorpay Order
 */
"use client";

import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { appointmentsKey } from "@/lib/swr-keys";
import type { RazorpayOrderResponseDto } from "@/sdk/backend-v2";
import {
  crmControllerCancelAppointment,
  crmControllerFetchAppointmentDetails,
  crmControllerRazorpayOrder,
  type SlotDetailDto,
} from "@/sdk/backend-v2";

export type { RazorpayOrderResponseDto, SlotDetailDto };

/*
 * Creates a Razorpay Order for an already-booked slot (CRM `booked` =
 * hold pending online payment). The caller passes the returned
 * RazorpayOrderResponseDto into Razorpay Standard Checkout. expiry_date
 * is Unix SECONDS, not ms.
 */
export async function startConsultAppointmentPayment(
  apt: SlotDetailDto,
  auth: { leadId: number },
): Promise<RazorpayOrderResponseDto> {
  if (!auth.leadId) throw new Error("Missing account information. Please sign in again.");

  const orderRes = await crmControllerRazorpayOrder({
    body: {
      slot_id: apt.id,
      lead_id: auth.leadId,
      expiry_date: Math.floor(Date.now() / 1000) + 86400,
    },
  });

  if (orderRes.error) throw new Error("Payment could not be started. Please try again.");

  const order = orderRes.data?.result;
  if (!order) throw new Error("No order received. Please try again.");

  return order;
}

// Fixed at module level so SWR key never changes between renders.
// Changing the key on each render would cause SWR to think the resource changed
// and re-fetch unnecessarily.
const ONE_YEAR_AGO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

function isUpcoming(apt: SlotDetailDto): boolean {
  const status = apt.availability?.toLowerCase();
  if (status === "cancelled" || status === "completed") return false;
  return new Date(apt.start_datetime) >= new Date();
}

export function useAppointments() {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;

  // When leadId is null, SWR key becomes null which disables fetching.
  const { data, isLoading, error, mutate } = useSWR(
    leadId ? appointmentsKey() : null,
    async () => {
      const res = await crmControllerFetchAppointmentDetails({
        query: { leadId: leadId!, startDatetime: ONE_YEAR_AGO },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? [];
    },
    { revalidateOnFocus: false },
  );

  const all = data ?? [];

  return {
    upcoming: all
      .filter(isUpcoming)
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()),
    past: all
      .filter((a) => !isUpcoming(a))
      .sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()),
    isLoading,
    error,
    refetch: mutate,
  };
}

export function useAppointmentById(id: number | null) {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;

  // Fetch all appointments; filter to the target ID on the client.
  const { data, isLoading, error, mutate } = useSWR(
    leadId && id ? appointmentsKey() : null,
    async () => {
      const res = await crmControllerFetchAppointmentDetails({
        query: { leadId: leadId!, startDatetime: ONE_YEAR_AGO },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? [];
    },
    { revalidateOnFocus: false },
  );

  const appointment = (data ?? []).find((a) => a.id === id) ?? null;

  return { appointment, isLoading, error, refetch: mutate };
}

/** Hook that returns a bound cancel function. */
export function useAppointmentMutations() {
  const { mutate } = useSWRConfig();

  const cancelAppointmentAndRefresh = useCallback(
    async (appointmentId: number, reason: string): Promise<void> => {
      await crmControllerCancelAppointment({
        body: {
          appointment_id: appointmentId,
          medium_id: 5,
          cancel_reason: reason,
        },
      });
      // Invalidate the appointments cache so the UI refetches.
      await mutate(appointmentsKey());
    },
    [mutate],
  );

  return { cancelAppointment: cancelAppointmentAndRefresh };
}

/** Legacy function for backward compatibility. Use useAppointmentMutations() instead. */
export async function cancelAppointment(appointmentId: number, reason: string): Promise<void> {
  await crmControllerCancelAppointment({
    body: {
      appointment_id: appointmentId,
      medium_id: 5,
      cancel_reason: reason,
    },
  });
}
