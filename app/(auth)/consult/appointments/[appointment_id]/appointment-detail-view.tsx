/**
 * FILE: app/(auth)/consult/appointments/[appointment_id]/appointment-detail-view.tsx
 *
 * PURPOSE:
 *   Client UI for a single consult appointment (doctor, time, status, pay-to-confirm,
 *   join / reschedule / cancel). Lives beside page.tsx for a stable Turbopack chunk id.
 *
 * LAST UPDATED: 2026-05-07 — Restored pay row + status after upstream revert
 */
"use client";

import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Video,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SlotDetailDto } from "@/hooks/appointments/use-appointments-page";
import {
  cancelAppointment,
  startConsultAppointmentPayment,
  useAppointmentById,
} from "@/hooks/appointments/use-appointments-page";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { cn } from "@/lib/utils";

function getDoctorName(doctor: SlotDetailDto["doctor"]): string {
  if (Array.isArray(doctor) && doctor.length >= 2 && typeof doctor[1] === "string") {
    const raw = doctor[1];
    const name = raw.includes(",") ? raw.split(",").pop()!.trim() : raw.trim();
    return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
  }
  return "Doctor";
}

function getSpeciality(specialityId: SlotDetailDto["speciality_id"]): string {
  if (
    Array.isArray(specialityId) &&
    specialityId.length >= 2 &&
    typeof specialityId[1] === "string"
  ) {
    return specialityId[1];
  }
  return "";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (new Date().toDateString() === d.toDateString()) return "Today";
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function normalizeAvailability(raw: string | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

/** CRM `slot.booking.availability` — "booked" is used for a hold pending online payment (legacy app). */
function isBookedPendingPayment(availability: string | undefined): boolean {
  return normalizeAvailability(availability) === "booked";
}

function appointmentStatusLabel(availability: string | undefined): string {
  const a = normalizeAvailability(availability);
  if (a === "booked") return "Booked";
  if (a === "confirmed") return "Confirmed";
  if (!a) return "—";
  return a.charAt(0).toUpperCase() + a.slice(1);
}

function statusBadgeClassName(availability: string | undefined): string {
  const a = normalizeAvailability(availability);
  if (a === "booked") return "bg-amber-50 text-amber-900 border-amber-200/80";
  if (a === "confirmed") return "bg-emerald-50 text-emerald-900 border-emerald-200/80";
  return "bg-muted/60 text-foreground border-border";
}

function DetailContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { appointment_id } = useParams<{ appointment_id: string }>();
  const id = Number(appointment_id);

  const { appointment: apt, isLoading, refetch } = useAppointmentById(isNaN(id) ? null : id);

  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!apt || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await cancelAppointment(apt.id, cancelReason.trim());
      await refetch();
      router.push("/consult/appointments");
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const handlePayToConfirm = async () => {
    if (!apt || paying) return;
    setPayError(null);
    setPaying(true);
    try {
      const leadId = user?.lead_id ? Number(user.lead_id) : 0;
      const uid = user?.sub ?? "";
      const url = await startConsultAppointmentPayment(apt, { leadId, uid });
      window.location.href = url;
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Something went wrong.");
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!apt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">Appointment not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const doctorName = getDoctorName(apt.doctor);
  const speciality = getSpeciality(apt.speciality_id);
  const isVirtual = !!apt.virtual_consultation_url;
  const isCancelled = apt.availability?.toLowerCase() === "cancelled";
  const isCompleted = apt.availability?.toLowerCase() === "completed";
  const isPast = isCancelled || isCompleted;
  const initials = doctorName
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const bookedPending = isBookedPendingPayment(apt.availability);
  const confirmed = normalizeAvailability(apt.availability) === "confirmed";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title="Session details"
        fallback="/consult/appointments"
        right={
          <button
            type="button"
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        }
      />

      <div className="flex-1 w-full max-w-xl mx-auto px-4 pb-36 space-y-5 overflow-y-auto">
        {/* Doctor — same row treatment as consult booking */}
        <div className="rounded-2xl border border-border bg-background p-4 shadow-[var(--sh-1)] flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-border/60">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold rounded-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground leading-snug truncate">{doctorName}</p>
            {speciality ? (
              <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{speciality}</p>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-[10px] font-semibold capitalize border",
              statusBadgeClassName(apt.availability),
            )}
          >
            {appointmentStatusLabel(apt.availability)}
          </Badge>
        </div>

        {/* When & how — single card */}
        <div className="rounded-2xl border border-border bg-background shadow-[var(--sh-1)] overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              When &amp; how
            </p>
          </div>
          <Separator />
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Date
              </p>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {formatDate(apt.start_datetime)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(apt.start_datetime)}
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Session type
              </p>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {isVirtual ? (
                    <Video className="h-4 w-4 text-primary" />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {isVirtual ? "Video call" : "In-person"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isVirtual && !isPast && (
          <div className="space-y-1.5">
            <Button
              type="button"
              variant="mt-primary"
              size="mt-sm"
              className="w-full h-10 rounded-full text-sm font-semibold gap-2"
              onClick={() => {
                if (apt.virtual_consultation_url) {
                  window.open(apt.virtual_consultation_url, "_blank");
                }
              }}
            >
              <Video className="h-4 w-4" />
              Join session
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center px-1">
              <Info className="h-3 w-3 shrink-0 opacity-80" />
              Opens up to 10 minutes before start.
            </p>
          </div>
        )}

        {!isPast && bookedPending && (
          <div className="rounded-2xl border border-border bg-background p-4 shadow-[var(--sh-1)] space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    Payment pending
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                    Confirm to secure this slot.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full sm:w-auto shrink-0 rounded-md px-3 text-xs font-medium gap-1.5 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary shadow-none sm:ml-auto"
                onClick={handlePayToConfirm}
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
            {payError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-start gap-2"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {payError}
              </div>
            )}
          </div>
        )}

        {!isPast && !bookedPending && (
          <div className="rounded-2xl border border-border bg-muted/30 px-3.5 py-3 flex gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 text-sm text-muted-foreground leading-relaxed">
              {confirmed ? (
                <>
                  You&apos;re set for this session. Join from here at the scheduled time
                  {isVirtual ? "." : ", or arrive a few minutes early at the centre."}
                </>
              ) : (
                <>
                  Status:{" "}
                  <span className="font-medium text-foreground">
                    {appointmentStatusLabel(apt.availability)}
                  </span>
                  .
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!isPast && (
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-xl mx-auto w-full flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 rounded-full font-medium gap-2 border-border shadow-none"
              onClick={() => {
                const doctorId =
                  Array.isArray(apt.doctor) && apt.doctor.length > 0 ? apt.doctor[0] : null;
                const params = new URLSearchParams({
                  reschedule: "true",
                  appointment_id: String(apt.id),
                  appointment_type: apt.appointment_type ?? "",
                });
                router.push(
                  doctorId
                    ? `/consult/booking/${doctorId}?${params.toString()}`
                    : "/consult/find-therapist",
                );
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Reschedule
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={cancelling}
                  className="flex-1 h-11 rounded-full font-medium gap-2 border-destructive/25 text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please share a short reason. We&apos;ll cancel your session with {doctorName}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-1">
                  <p className="text-sm font-medium">
                    Reason <span className="text-destructive">*</span>
                  </p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Optional context helps us improve…"
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel
                    onClick={() => setCancelReason("")}
                    className="rounded-full mt-0"
                  >
                    Keep appointment
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={!cancelReason.trim()}
                    className="rounded-full bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
                  >
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppointmentDetailView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DetailContent />
    </Suspense>
  );
}
