/**
 * FILE: app/(auth)/consult/booking/[doctor_id]/page.tsx
 *
 * PURPOSE:
 *   Slot selection page for booking or rescheduling an appointment with a doctor.
 *   Shows a date strip, slot grid by time of day, and campus selection sheet.
 *
 * LOGIC OVERVIEW:
 *   1. Reads doctorId from URL params; fetches doctor details, available slots,
 *      slot price, and campuses in parallel.
 *   2. Date strip lets the user pick a date; slots are filtered by that date.
 *   3. CampusSheet opens when user taps a slot and chooses in-person.
 *   4. On slot + campus confirm: saves to BookingContext and navigates to checkout.
 *   5. isReschedule mode reads appointmentId from search params and calls
 *      crmControllerRescheduleAppointment instead of navigating to checkout.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   doctorId     — URL param
 *   isReschedule — derived from searchParams.has('reschedule')
 *   selectedDate — date key (YYYY-MM-DD) controlling slot filtering
 *
 * DEPENDENCIES:
 *   crmControllerGetDoctorById, crmControllerGetSlots, crmControllerGetSlotPrice,
 *   crmControllerGetCampuses, crmControllerRescheduleAppointment — SDK calls
 *   useBooking — BookingContext for saving selection before checkout
 *   PageHeader — shared navigation header
 *
 * LAST UPDATED: 2026-04-24 — filter out past and in-progress slots so only future slots are shown
 */
"use client";

import { CampusSheet } from "@/components/booking/campus-sheet";
import { DateStrip, toDateKey } from "@/components/booking/date-strip";
import { SlotSection } from "@/components/booking/slot-section";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/contexts/booking-context";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { cn } from "@/lib/utils";
import {
  crmControllerGetCampuses,
  crmControllerGetDoctorById,
  crmControllerGetSlotPrice,
  crmControllerGetSlots,
  crmControllerRescheduleAppointment,
} from "@/sdk/backend-v2";
import type { DoctorBasicResponseDto, SlotResponseDto } from "@/sdk/backend-v2";
import { AlertCircle, Building2, Loader2, Video } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

// The API returns additional fields not yet in the generated DTO
type DoctorResponseDto = DoctorBasicResponseDto & {
  doctor_type?: string;
  profile_image?: string;
  campus_ids?: number[];
};

type CampusItem = {
  id: number;
  name: string;
  display_name?: string;
  book_appointment?: boolean;
  area?: Array<[string | number, string | number]>;
  [key: string]: unknown;
};

// ── helpers ────────────────────────────────────────────────────────────────────
function displayName(doctor: DoctorResponseDto | null): string {
  if (!doctor) return "Doctor";
  const raw = (doctor.name || "").trim();
  const name = raw.includes(",") ? raw.split(",").pop()!.trim() : raw;
  if (!name) return "Doctor";
  return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

function specialityName(doctor: DoctorResponseDto | null): string {
  if (!doctor) return "";
  return doctor.doctor_type || "";
}

// ── BookingContent ─────────────────────────────────────────────────────────────
function BookingContent() {
  const router = useRouter();
  const { setBooking } = useBooking();
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const isReschedule = searchParams.get("reschedule") === "true";
  const existingSlotId = isReschedule ? Number(searchParams.get("appointment_id")) : null;
  const rescheduleAptType = searchParams.get("appointment_type") ?? "";
  const initMode = searchParams.get("mode") ?? "online";

  // ── doctor ──────────────────────────────────────────────────────────────────
  const [doctor, setDoctor] = useState<DoctorResponseDto | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  // ── all campuses ─────────────────────────────────────────────────────────────
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // ── slots ───────────────────────────────────────────────────────────────────
  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const [isOnline, setIsOnline] = useState(initMode !== "offline");
  const [datePage, setDatePage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [newSlotId, setNewSlotId] = useState<number | null>(null);
  const [slotPrice, setSlotPrice] = useState<number | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── campus sheet ─────────────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStep, setSheetStep] = useState<"campus" | "sub-campus">("campus");
  const [pendingCampusId, setPendingCampusId] = useState<number | null>(null);
  const [confirmedCampusId, setConfirmedCampusId] = useState<number | null>(null);
  const [confirmedSubId, setConfirmedSubId] = useState<number | null>(null);

  // ── fetch doctor ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!doctor_id) return;
    setLoadingDoc(true);
    crmControllerGetDoctorById({ path: { id: Number(doctor_id) } })
      .then((r) => {
        const d = r.data as DoctorResponseDto | undefined;
        if (!d) throw new Error("Not found");
        setDoctor(d);
      })
      .catch(() => setDocError("Failed to load doctor details."))
      .finally(() => setLoadingDoc(false));
  }, [doctor_id]);

  // ── fetch campuses ───────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingMeta(true);
    crmControllerGetCampuses({})
      .then((r) => {
        const raw = Array.isArray(r.data) ? r.data : r.data ? [r.data] : [];
        setCampuses((raw as CampusItem[]).filter((c) => c.book_appointment));
      })
      .catch(() => {})
      .finally(() => setLoadingMeta(false));
  }, []);

  // ── fetch slots ───────────────────────────────────────────────────────────────
  const fetchSlots = useCallback(
    async (consultTypeId: number) => {
      if (!doctor_id) return;
      setLoadingSlots(true);
      setSlots([]);
      setNewSlotId(null);
      setSlotPrice(null);
      setError(null);
      try {
        const start = new Date(dates[0]);
        const end = new Date(dates[dates.length - 1]);
        end.setHours(23, 59, 59, 999);
        const res = await crmControllerGetSlots({
          query: {
            doctor_id: Number(doctor_id),
            availability: "open",
          },
        });
        setSlots(Array.isArray(res.data) ? (res.data as SlotResponseDto[]) : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load time slots. Please try again.");
      } finally {
        setLoadingSlots(false);
      }
    },
    [doctor_id, dates],
  );

  useEffect(() => {
    fetchSlots(isOnline ? 2 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (newSlotId === null) {
      setSlotPrice(null);
      return;
    }
    crmControllerGetSlotPrice({ path: { id: newSlotId } })
      .then((r) => {
        const d = r.data as { price?: number } | undefined;
        setSlotPrice(d?.price ?? null);
      })
      .catch(() => setSlotPrice(null));
  }, [newSlotId]);

  // ── open sheet when slot is picked (in-person only) ─────────────────────────
  useEffect(() => {
    if (newSlotId !== null && !isOnline) {
      setSheetStep("campus");
      setPendingCampusId(null);
      setSheetOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSlotId]);

  const handleSessionToggle = (online: boolean) => {
    setIsOnline(online);
    setConfirmedCampusId(null);
    setConfirmedSubId(null);
    fetchSlots(online ? 2 : 1);
  };

  // ── derived sub-campus options (from campus master data) ─────────────────────
  const getSubCampusOptions = useCallback(
    (campusId: number) => {
      const master = campuses.find((c) => c.id === campusId);
      return (master?.area ?? []).map(([id, name]) => ({
        id: Number(id),
        name: String(name),
      }));
    },
    [campuses],
  );

  // ── filter campuses to only those where the doctor is available ──────────────
  // doctor.campus_ids is an array of campus IDs (e.g. [4]) returned by the API.
  // We filter the master campus list so only the doctor's campuses appear in the sheet.
  const availableCampuses = useMemo(() => {
    if (!doctor?.campus_ids?.length) return campuses;
    const allowed = new Set(doctor.campus_ids);
    return campuses.filter((c) => allowed.has(c.id));
  }, [campuses, doctor]);

  // ── derived display values ───────────────────────────────────────────────────
  const slotsByDate = useMemo(() => {
    const map: Record<string, SlotResponseDto[]> = {};
    for (const s of slots) {
      const key = s.start_datetime.slice(0, 10);
      (map[key] ??= []).push(s);
    }
    return map;
  }, [slots]);

  const maxPage = Math.ceil(dates.length / 10) - 1;

  const selectedKey = toDateKey(selectedDate);
  // Only show slots that haven't started yet. Slots with start_datetime <= now are
  // either already past or currently in progress — both must be hidden.
  const now = new Date();
  const daySlots = (slotsByDate[selectedKey] ?? []).filter((s) => new Date(s.start_datetime) > now);
  const morningSlots = daySlots.filter((s) => new Date(s.start_datetime).getHours() < 12);
  const afternoonSlots = daySlots.filter((s) => {
    const h = new Date(s.start_datetime).getHours();
    return h >= 12 && h < 17;
  });
  const eveningSlots = daySlots.filter((s) => new Date(s.start_datetime).getHours() >= 17);

  const slotHeading = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const sessionDuration = slots[0]?.duration ?? null;

  const initials = (doctor?.name || "")
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const confirmedCampusName =
    confirmedCampusId !== null
      ? availableCampuses.find((c) => c.id === confirmedCampusId)?.display_name ||
        availableCampuses.find((c) => c.id === confirmedCampusId)?.name ||
        null
      : null;

  const confirmedSubName = useMemo(() => {
    if (confirmedSubId === null || confirmedCampusId === null) return null;
    return (
      getSubCampusOptions(confirmedCampusId).find((s) => s.id === confirmedSubId)?.name ?? null
    );
  }, [confirmedSubId, confirmedCampusId, getSubCampusOptions]);

  // ── confirm booking / reschedule ─────────────────────────────────────────────
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!newSlotId) {
      setError("Please select a time slot to continue.");
      return;
    }
    if (!isOnline && !confirmedCampusId) {
      setError("Please select a campus to continue.");
      return;
    }
    const hasSubs =
      !isOnline && confirmedCampusId ? getSubCampusOptions(confirmedCampusId).length > 0 : false;
    if (hasSubs && !confirmedSubId) {
      setError("Please select a center to continue.");
      return;
    }

    if (isReschedule && existingSlotId) {
      const leadId = user?.lead_id ? Number(user.lead_id) : null;
      if (!leadId) {
        setError("User session missing. Please log in again.");
        return;
      }
      if (!confirmedCampusId && !isOnline) {
        setError("Please select a campus to continue.");
        return;
      }
      setConfirming(true);
      setError(null);
      try {
        await crmControllerRescheduleAppointment({
          body: {
            slot_id: existingSlotId, // existing slot being replaced
            appointment_id: newSlotId, // new slot selected by user
            lead_id: leadId,
            campus_id: confirmedCampusId ?? 1,
            sub_campus_id: confirmedSubId ?? undefined,
            consultation_type_id: isOnline ? 2 : 1,
            caller_name: user?.name ?? "",
            patient_name: user?.name ?? "",
            appointment_type: rescheduleAptType,
            payment_mode: isOnline ? "online" : "cash",
          } as Parameters<typeof crmControllerRescheduleAppointment>[0]["body"],
        });
        router.push("/consult/appointments");
      } catch {
        setError("Failed to reschedule. Please try again.");
      } finally {
        setConfirming(false);
      }
      return;
    }

    const slot = slots.find((s) => s.id === newSlotId);
    setBooking({
      slotId: newSlotId,
      doctorId: Number(doctor_id),
      campusId: confirmedCampusId,
      subCampusId: isOnline ? null : confirmedSubId,
      consultationTypeId: isOnline ? 2 : 1,
      startDatetime: slot?.start_datetime ?? null,
    });
    router.push("/consult/checkout");
  };

  // ── loading / error states ────────────────────────────────────────────────────
  if (loadingDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (docError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{docError}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title={isReschedule ? "Reschedule appointment" : "Select a slot"}
        fallback="/consult/find-therapist"
      />

      <div className="flex-1 px-4 pb-36 space-y-5 max-w-xl mx-auto w-full">
        {/* ── Doctor card ── */}
        <div className="rounded-2xl border border-border bg-background p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-11 w-11 shrink-0 rounded-xl">
              {doctor?.profile_image && (
                <AvatarImage src={doctor.profile_image} alt={displayName(doctor)} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm rounded-xl">
                {initials || "DR"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{displayName(doctor)}</p>
              <p className="text-xs text-muted-foreground leading-snug">
                {[specialityName(doctor), sessionDuration ? `${sessionDuration} min session` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-orange-50 rounded-xl p-2.5">
            {isOnline ? (
              <Video className="h-4 w-4 text-primary" />
            ) : (
              <Building2 className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>

        {/* ── Session type toggle ── */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Session type</span>
          <div className="flex rounded-lg bg-muted p-0.5 text-sm font-medium">
            <button
              type="button"
              onClick={() => handleSessionToggle(true)}
              className={cn(
                "px-4 py-1.5 rounded-md transition-all",
                isOnline ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Online
            </button>
            <button
              type="button"
              onClick={() => handleSessionToggle(false)}
              className={cn(
                "px-4 py-1.5 rounded-md transition-all",
                !isOnline ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              In-person
            </button>
          </div>
        </div>

        {/* ── Date strip ── */}
        <DateStrip
          dates={dates}
          slotsByDate={slotsByDate}
          selectedDate={selectedDate}
          datePage={datePage}
          maxPage={maxPage}
          loadingSlots={loadingSlots}
          onDateSelect={setSelectedDate}
          onPageChange={setDatePage}
        />

        {/* ── Slots ── */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">Available slots for {slotHeading}</h2>

          {loadingSlots ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : daySlots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No slots available for this date
            </p>
          ) : (
            <>
              <SlotSection
                title="Morning"
                slots={morningSlots}
                selectedId={newSlotId}
                onSelect={setNewSlotId}
              />
              <SlotSection
                title="Afternoon"
                slots={afternoonSlots}
                selectedId={newSlotId}
                onSelect={setNewSlotId}
              />
              <SlotSection
                title="Evening"
                slots={eveningSlots}
                selectedId={newSlotId}
                onSelect={setNewSlotId}
              />
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm mt-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* ── Campus summary (shown after campus confirmed) ── */}
        {confirmedCampusId !== null && (
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Selected campus</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {confirmedCampusName}
              </p>
              {confirmedSubName && (
                <p className="text-xs text-muted-foreground truncate">{confirmedSubName}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSheetStep("campus");
                setPendingCampusId(null);
                setSheetOpen(true);
              }}
              className="text-xs font-medium text-primary shrink-0 hover:underline"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 flex items-center justify-between gap-4">
        <div>
          {slotPrice !== null ? (
            <>
              <p className="text-xl font-bold">₹{slotPrice}</p>
              <p className="text-xs text-muted-foreground">
                Per{sessionDuration ? ` ${sessionDuration} min` : ""} session
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a slot</p>
          )}
        </div>
        <Button
          onClick={handleConfirm}
          disabled={
            confirming ||
            !newSlotId ||
            (!isOnline &&
              (!confirmedCampusId ||
                (confirmedCampusId !== null &&
                  getSubCampusOptions(confirmedCampusId).length > 0 &&
                  !confirmedSubId)))
          }
          className="rounded-full px-8 h-12 text-sm font-semibold"
        >
          {confirming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isReschedule ? (
            "Confirm reschedule"
          ) : (
            "Confirm booking"
          )}
        </Button>
      </div>

      {/* ── Campus / Sub-campus Sheet ── */}
      <CampusSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        step={sheetStep}
        onStepChange={setSheetStep}
        pendingCampusId={pendingCampusId}
        onPendingCampusChange={setPendingCampusId}
        confirmedCampusId={confirmedCampusId}
        onConfirmedCampusChange={setConfirmedCampusId}
        confirmedSubId={confirmedSubId}
        onConfirmedSubChange={setConfirmedSubId}
        campuses={availableCampuses}
        isOnline={isOnline}
        loading={loadingMeta}
      />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
