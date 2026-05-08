/**
 * FILE: components/appointments/appointment-card.tsx
 *
 * PURPOSE:
 *   Displays a single appointment in list view. Shows doctor name, time, status,
 *   consultation type, and session status indicator (online/in-person).
 *
 * LOGIC OVERVIEW:
 *   Outer container is a flex row/card. Main area is a button that opens session detail.
 *   Upcoming + CRM availability `booked` shows a separate Pay now button (Razorpay).
 *   Status badge colours: booked = amber, confirmed = emerald (aligned with session detail).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   appointment  — SlotDetailDto from the appointments list
 *   isPast       — optional flag; if true, avatar shows muted colours
 *
 * DEPENDENCIES:
 *   SlotDetailDto, startConsultAppointmentPayment — from use-appointments-page
 *   useAuth — lead_id + sub for payment
 *
 * LAST UPDATED: 2026-05-06 — Compact outline Pay control for booked rows
 */
"use client";

import { Building2, Calendar, Clock, CreditCard, Loader2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { toast } from "react-toastify";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SlotDetailDto } from "@/hooks/appointments/use-appointments-page";
import {
  startConsultAppointmentPayment,
  startConsultAppointmentPaymentLink,
} from "@/hooks/appointments/use-appointments-page";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { openRazorpayNative } from "@/lib/capacitor/razorpay";
import { isLinkMode } from "@/lib/payments/payment-mode";

interface AppointmentCardProps {
  appointment: SlotDetailDto;
  isPast?: boolean;
}

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "booked":
      return "bg-amber-50 text-amber-900 border-amber-200/80";
    case "confirmed":
      return "bg-emerald-50 text-emerald-900 border-emerald-200/80";
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "completed":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getDoctorName(doctor: SlotDetailDto["doctor"]): string {
  if (Array.isArray(doctor) && doctor.length >= 2 && typeof doctor[1] === "string") {
    const raw = doctor[1];
    const name = raw.includes(",") ? raw.split(",").pop()!.trim() : raw.trim();
    return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
  }
  return "Doctor";
}

function getConsultationType(ids: SlotDetailDto["consultation_type_ids"]): string {
  if (Array.isArray(ids) && ids.length >= 2 && typeof ids[1] === "string") return ids[1];
  return "";
}

function getInitials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppointmentCard({ appointment, isPast }: AppointmentCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);

  const doctorName = getDoctorName(appointment.doctor);
  const initials = getInitials(doctorName);
  const isVirtual = !!appointment.virtual_consultation_url;
  const status = appointment.availability || "booked";
  const showPayNow = !isPast && appointment.availability?.trim().toLowerCase() === "booked";

  const handlePayNow = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (paying) return;
    setPaying(true);
    try {
      const leadId = user?.lead_id ? Number(user.lead_id) : 0;

      // Link mode: backend mints a hosted Payment Link, we redirect to it.
      if (isLinkMode()) {
        const uid = user?.sub ? String(user.sub) : "";
        if (!uid) {
          toast.error("Missing session. Please sign in again.");
          setPaying(false);
          return;
        }
        const link = await startConsultAppointmentPaymentLink(appointment, { leadId, uid });
        if (!link.short_url) {
          toast.error("No payment link returned.");
          setPaying(false);
          return;
        }
        window.location.href = link.short_url;
        return;
      }

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        toast.error("Payment is not configured.");
        setPaying(false);
        return;
      }
      const order = await startConsultAppointmentPayment(appointment, { leadId });

      /*
       * Standard Checkout opens an in-page modal (web) or native sheet
       * (Capacitor). Server-side confirmation runs via the Razorpay →
       * backend webhook; we just navigate to the appointment detail
       * after the modal closes successfully.
       */
      const result = await openRazorpayNative({
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
        name: "Cadabam's Consultation",
        description: `Appointment with ${doctorName}`,
        prefill: {
          name: user?.name ? String(user.name) : undefined,
          email: user?.email ? String(user.email) : undefined,
          contact: user?.phone_number ? String(user.phone_number) : undefined,
        },
      });

      if (!result.success) {
        toast.error(result.error ?? "Payment was not completed.");
        setPaying(false);
        return;
      }

      router.push(`/consult/appointments/${appointment.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment could not be started.");
      setPaying(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-border shadow-[var(--sh-1)] p-4 flex flex-col gap-0 sm:flex-row sm:items-stretch sm:gap-0">
      <button
        type="button"
        onClick={() => router.push(`/consult/appointments/${appointment.id}`)}
        className="flex-1 flex items-center gap-3 min-w-0 text-left rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] transition-transform sm:pr-3"
      >
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarFallback
              className={`text-sm font-semibold ${isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isPast && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-foreground truncate">{doctorName}</p>
            <Badge
              variant="outline"
              className={`text-[10px] shrink-0 capitalize border ${getStatusColor(status)}`}
            >
              {status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getConsultationType(appointment.consultation_type_ids)}
          </p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(appointment.start_datetime)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(appointment.start_datetime)}
            </span>
            {isVirtual ? (
              <Video className="h-3 w-3 text-primary sm:ml-auto" />
            ) : (
              <Building2 className="h-3 w-3 text-muted-foreground sm:ml-auto" />
            )}
          </div>
        </div>
      </button>

      {showPayNow && (
        <div className="mt-3 pt-3 border-t border-border/60 flex justify-end sm:mt-0 sm:pt-0 sm:border-0 sm:border-l sm:pl-3 sm:items-center sm:justify-center shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-md px-2.5 text-xs font-medium gap-1.5 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary shadow-none"
            onClick={handlePayNow}
            disabled={paying}
          >
            {paying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CreditCard className="h-3.5 w-3.5" />
            )}
            Pay
          </Button>
        </div>
      )}
    </div>
  );
}
