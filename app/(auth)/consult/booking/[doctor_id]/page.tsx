/**
 * FILE: app/(auth)/consult/booking/[doctor_id]/page.tsx
 *
 * PURPOSE:
 *   Slot selection page for booking or rescheduling an appointment with a doctor.
 *   Shows a date strip, slot grid by time of day, and campus selection sheet.
 *
 * LOGIC OVERVIEW:
 *   1. Loads doctor via SDK; for in-person, `crmControllerListDoctorsWithSlots` (CRM `/get/doctors/testing`)
 *      supplies `campuses` + `availability` — same source as legacy (not Odoo campus.master).
 *   2. Online: open slots from CRM slots API; campus/sub-campus for checkout come from the selected
 *      slot’s Odoo tuples (same as legacy extracting from slots).
 *   3. In-person (legacy parity): user picks campus (and sub-campus if required) first; slots are
 *      fetched with campus_id / sub_campus_id + consultation type 1 + the same date window.
 *   4. CampusSheet uses existing Neo styling; optional ?campus_id / ?sub_campus_id from find-therapist.
 *   5. Reschedule uses crmControllerRescheduleAppointment with cash payment_mode for in-person.
 *
 * DEPENDENCIES:
 *   crmControllerGetDoctorById, crmControllerListDoctorsWithSlots, crmControllerGetSlots,
 *   crmControllerGetSlotPrice, crmControllerRescheduleAppointment (all from `@/sdk/backend-v2`)
 *
 * LAST UPDATED: 2026-05-06 — SDK-only CRM calls; extended `DoctorListingPageResponseDto` for campuses/availability.
 */
"use client";

import { AlertCircle, Building2, Loader2, MapPin, Video } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CampusSheet } from "@/components/booking/campus-sheet";
import { DateStrip, toDateKey } from "@/components/booking/date-strip";
import { SlotSection } from "@/components/booking/slot-section";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/contexts/booking-context";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { cn } from "@/lib/utils";
import type {
  CampusMasterResponseDto,
  DoctorListingPageResponseDto,
  DoctorListingResponseDto,
  DoctorListingTestingCampusDto,
  SlotPriceResponseDto,
  SlotResponseDto,
} from "@/sdk/backend-v2";
import {
  crmControllerGetDoctorById,
  crmControllerGetSlotPrice,
  crmControllerGetSlots,
  crmControllerListDoctorsWithSlots,
  crmControllerRescheduleAppointment,
} from "@/sdk/backend-v2";

/** Build master-shaped rows for summary / sheet prop from CRM testing `campuses` (SDK types only). */
function testingRowsToCampusMasters(
  rows: DoctorListingTestingCampusDto[],
): CampusMasterResponseDto[] {
  const byId = new Map<number, CampusMasterResponseDto>();
  for (const r of rows) {
    if (byId.has(r.campus_id)) continue;
    byId.set(r.campus_id, {
      id: r.campus_id,
      name: r.name,
      code: "",
      alias: null,
      city: [r.campus_id, r.city],
      latitude: null,
      longitude: null,
      book_appointment: true,
      is_hospital: false,
      enable_emergency: false,
      create_patient: false,
    });
  }
  return [...byId.values()];
}

/** Odoo many2one-style [id, name] from slot API — legacy reads `slot.campus_id[0]` */
function odooTupleFirstId(tuple: Array<unknown> | null | undefined): number | null {
  if (!tuple || !Array.isArray(tuple) || tuple.length === 0) return null;
  const v = tuple[0];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function displayName(doctor: DoctorListingResponseDto | null): string {
  if (!doctor) return "Doctor";
  const raw = (doctor.name || "").trim();
  const name = raw.includes(",") ? raw.split(",").pop()!.trim() : raw;
  if (!name) return "Doctor";
  return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

function specialityName(doctor: DoctorListingResponseDto | null): string {
  if (!doctor) return "";
  const t = doctor.speciality_id;
  if (Array.isArray(t) && t.length > 1) {
    const label = t[1];
    if (typeof label === "string") return label;
  }
  return "";
}

function crmWindowFromDates(dates: Date[]): { start: string; end: string } {
  const start = `${toDateKey(dates[0])} 00:00:00`;
  const end = `${toDateKey(dates[dates.length - 1])} 23:59:59`;
  return { start, end };
}

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
  const initInPerson = initMode === "in-person" || initMode === "offline";

  const [doctor, setDoctor] = useState<DoctorListingResponseDto | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  const [testingCampuses, setTestingCampuses] = useState<DoctorListingTestingCampusDto[]>([]);
  const [crmAvailability, setCrmAvailability] = useState<
    NonNullable<DoctorListingPageResponseDto["availability"]>
  >({});
  const [loadingBookingContext, setLoadingBookingContext] = useState(false);

  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const [isOnline, setIsOnline] = useState(!initInPerson);
  const [datePage, setDatePage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [newSlotId, setNewSlotId] = useState<number | null>(null);
  const [slotPrice, setSlotPrice] = useState<number | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<Date | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStep, setSheetStep] = useState<"campus" | "sub-campus">("campus");
  const [pendingCampusId, setPendingCampusId] = useState<number | null>(null);
  const [confirmedCampusId, setConfirmedCampusId] = useState<number | null>(null);
  const [confirmedSubId, setConfirmedSubId] = useState<number | null>(null);

  const didApplyUrlCampus = useRef(false);
  const shouldAutoOpenCampusRef = useRef(initInPerson && !searchParams.get("campus_id"));

  useEffect(() => {
    if (didApplyUrlCampus.current) return;
    const c = searchParams.get("campus_id");
    const s = searchParams.get("sub_campus_id");
    if (c) {
      const cid = Number(c);
      if (!Number.isNaN(cid)) {
        setConfirmedCampusId(cid);
        if (s) {
          const sid = Number(s);
          if (!Number.isNaN(sid)) setConfirmedSubId(sid);
        }
        shouldAutoOpenCampusRef.current = false;
      }
      didApplyUrlCampus.current = true;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!doctor_id) return;
    setLoadingDoc(true);
    crmControllerGetDoctorById({ path: { id: Number(doctor_id) } })
      .then((r) => {
        const d = r.data;
        if (!d) throw new Error("Not found");
        setDoctor(d);
      })
      .catch(() => setDocError("Failed to load doctor details."))
      .finally(() => setLoadingDoc(false));
  }, [doctor_id]);

  useEffect(() => {
    if (!doctor_id || isOnline) {
      setTestingCampuses([]);
      setCrmAvailability({});
      setLoadingBookingContext(false);
      return;
    }
    let cancelled = false;
    const { start, end } = crmWindowFromDates(dates);
    setLoadingBookingContext(true);
    crmControllerListDoctorsWithSlots({
      query: {
        doctor_id: Number(doctor_id),
        consultation_type_id: 1,
        start_datetime: start,
        stop_datetime: end,
        ...(confirmedCampusId != null ? { campus_id: confirmedCampusId } : {}),
        ...(confirmedSubId != null ? { sub_campus_id: confirmedSubId } : {}),
      },
    })
      .then((r) => {
        if (cancelled) return;
        const data = r.data;
        setTestingCampuses(data?.campuses ?? []);
        setCrmAvailability(data?.availability ?? {});
      })
      .catch(() => {
        if (!cancelled) {
          setTestingCampuses([]);
          setCrmAvailability({});
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBookingContext(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctor_id, isOnline, dates, confirmedCampusId, confirmedSubId]);

  const getSubCampusOptions = useCallback(
    (campusId: number) => {
      if (testingCampuses.length === 0) return [];
      return testingCampuses
        .filter((r) => r.campus_id === campusId && typeof r.sub_campus_id === "number")
        .map((r) => ({ id: r.sub_campus_id as number, name: r.name }));
    },
    [testingCampuses],
  );

  const availableCampuses = useMemo(
    () => testingRowsToCampusMasters(testingCampuses),
    [testingCampuses],
  );

  const inPersonSelectionComplete = useMemo(() => {
    if (isOnline) return true;
    if (confirmedCampusId === null) return false;
    const subs = getSubCampusOptions(confirmedCampusId);
    if (subs.length > 0 && confirmedSubId === null) return false;
    return true;
  }, [isOnline, confirmedCampusId, confirmedSubId, getSubCampusOptions]);

  const fetchSlots = useCallback(
    async (opts: {
      consultTypeId: number;
      campusId?: number | null;
      subCampusId?: number | null;
    }) => {
      if (!doctor_id) return;
      const { consultTypeId, campusId, subCampusId } = opts;
      setLoadingSlots(true);
      setSlots([]);
      setNewSlotId(null);
      setSlotPrice(null);
      setError(null);
      try {
        const { start, end } = crmWindowFromDates(dates);
        const query: {
          doctor_id: number;
          availability: "open";
          consultation_type_ids: number;
          start_datetime: string;
          stop_datetime: string;
          campus_id?: number;
          sub_campus_id?: number;
        } = {
          doctor_id: Number(doctor_id),
          availability: "open",
          consultation_type_ids: consultTypeId,
          start_datetime: start,
          stop_datetime: end,
        };
        if (campusId != null) query.campus_id = campusId;
        if (subCampusId != null) query.sub_campus_id = subCampusId;

        const res = await crmControllerGetSlots({
          query,
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
    if (!doctor_id) return;
    if (isOnline) {
      void fetchSlots({ consultTypeId: 2 });
      return;
    }
    if (!inPersonSelectionComplete) {
      setSlots([]);
      setNewSlotId(null);
      setSlotPrice(null);
      return;
    }
    void fetchSlots({
      consultTypeId: 1,
      campusId: confirmedCampusId,
      subCampusId: confirmedSubId ?? undefined,
    });
  }, [
    doctor_id,
    isOnline,
    inPersonSelectionComplete,
    confirmedCampusId,
    confirmedSubId,
    fetchSlots,
  ]);

  useEffect(() => {
    if (newSlotId === null) {
      setSlotPrice(null);
      return;
    }
    crmControllerGetSlotPrice({ path: { id: newSlotId } })
      .then((r) => {
        const d: SlotPriceResponseDto | undefined = r.data;
        setSlotPrice(d?.price ?? null);
      })
      .catch(() => setSlotPrice(null));
  }, [newSlotId]);

  useEffect(() => {
    if (loadingDoc || !doctor || isOnline || isReschedule) return;
    if (!shouldAutoOpenCampusRef.current) return;
    if (loadingBookingContext) return;
    shouldAutoOpenCampusRef.current = false;
    setSheetStep("campus");
    setPendingCampusId(null);
    setSheetOpen(true);
  }, [loadingDoc, doctor, isOnline, isReschedule, loadingBookingContext]);

  const handleSessionToggle = (online: boolean) => {
    setIsOnline(online);
    setConfirmedCampusId(null);
    setConfirmedSubId(null);
    setNewSlotId(null);
    setSlotPrice(null);
    setError(null);
    setSlots([]);
    if (!online) {
      setSheetStep("campus");
      setPendingCampusId(null);
      setSheetOpen(true);
    }
  };

  const handleDateSelect = (date: Date) => {
    if (newSlotId === null || toDateKey(date) === toDateKey(selectedDate)) {
      setSelectedDate(date);
      return;
    }
    setPendingDateChange(date);
    setDiscardDialogOpen(true);
  };

  const handleDiscardConfirm = () => {
    if (pendingDateChange) {
      setSelectedDate(pendingDateChange);
      setNewSlotId(null);
      if (isOnline) {
        setConfirmedCampusId(null);
        setConfirmedSubId(null);
      }
    }
    setPendingDateChange(null);
    setDiscardDialogOpen(false);
  };

  const handleDiscardCancel = () => {
    setPendingDateChange(null);
    setDiscardDialogOpen(false);
  };

  const slotsByDate = useMemo(() => {
    const now = new Date();
    const map: Record<string, SlotResponseDto[]> = {};
    for (const s of slots) {
      if (new Date(s.start_datetime) <= now) continue;
      const key = s.start_datetime.slice(0, 10);
      (map[key] ??= []).push(s);
    }
    return map;
  }, [slots]);

  const maxPage = Math.ceil(dates.length / 10) - 1;

  const selectedKey = toDateKey(selectedDate);
  const daySlots = slotsByDate[selectedKey] ?? [];
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

  const confirmedCampusName = useMemo(() => {
    if (confirmedCampusId === null) return null;
    if (testingCampuses.length > 0) {
      const row = testingCampuses.find(
        (r) =>
          r.campus_id === confirmedCampusId &&
          (typeof r.sub_campus_id === "number"
            ? r.sub_campus_id === confirmedSubId
            : confirmedSubId === null),
      );
      if (row) return row.name;
      const any = testingCampuses.find((r) => r.campus_id === confirmedCampusId);
      if (any) return any.name;
    }
    return availableCampuses.find((c) => c.id === confirmedCampusId)?.name || null;
  }, [confirmedCampusId, confirmedSubId, testingCampuses, availableCampuses]);

  const confirmedSubName = useMemo(() => {
    if (confirmedSubId === null || confirmedCampusId === null) return null;
    return (
      getSubCampusOptions(confirmedCampusId).find((s) => s.id === confirmedSubId)?.name ?? null
    );
  }, [confirmedSubId, confirmedCampusId, getSubCampusOptions]);

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

    const pickedSlot = slots.find((s) => s.id === newSlotId);
    const slotCampusId = odooTupleFirstId(pickedSlot?.campus_id ?? null);
    const slotSubId = odooTupleFirstId(pickedSlot?.sub_campus_id ?? null);

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
            slot_id: existingSlotId,
            appointment_id: newSlotId,
            lead_id: leadId,
            campus_id: isOnline
              ? (slotCampusId ?? confirmedCampusId ?? 1)
              : (confirmedCampusId ?? 1),
            sub_campus_id: isOnline
              ? (slotSubId ?? confirmedSubId ?? undefined)
              : (confirmedSubId ?? undefined),
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

    setBooking({
      slotId: newSlotId,
      doctorId: Number(doctor_id),
      campusId: isOnline ? (slotCampusId ?? confirmedCampusId) : confirmedCampusId,
      subCampusId: isOnline ? (slotSubId ?? confirmedSubId) : confirmedSubId,
      consultationTypeId: isOnline ? 2 : 1,
      startDatetime: pickedSlot?.start_datetime ?? null,
    });
    router.push("/consult/checkout");
  };

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

  const showInPersonCampusPrompt = !isOnline && !inPersonSelectionComplete;
  const emptySlotMessage = showInPersonCampusPrompt
    ? "Choose your campus above to see available times."
    : "No slots available for this date";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title={isReschedule ? "Reschedule appointment" : "Select a slot"}
        fallback="/consult/find-therapist"
      />

      <div className="flex-1 px-4 pb-36 space-y-5 max-w-xl mx-auto w-full">
        <div className="rounded-2xl border border-border bg-background p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-11 w-11 shrink-0 rounded-xl">
              {doctor?.image && <AvatarImage src={doctor.image} alt={displayName(doctor)} />}
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

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Session type</span>
          <div className="flex rounded-lg bg-muted p-0.5 text-sm font-medium">
            <button
              type="button"
              onClick={() => handleSessionToggle(true)}
              className={cn(
                "px-4 py-1.5 rounded-md transition-all",
                isOnline
                  ? "bg-background text-foreground shadow-[var(--sh-1)]"
                  : "text-muted-foreground",
              )}
            >
              Online
            </button>
            <button
              type="button"
              onClick={() => handleSessionToggle(false)}
              className={cn(
                "px-4 py-1.5 rounded-md transition-all",
                !isOnline
                  ? "bg-background text-foreground shadow-[var(--sh-1)]"
                  : "text-muted-foreground",
              )}
            >
              In-person
            </button>
          </div>
        </div>

        {showInPersonCampusPrompt && (
          <div className="rounded-2xl border border-border bg-muted/30 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-primary uppercase tracking-wide">Location</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  Choose your campus first
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  In-person slots are shown only for the centre you select.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="mt-primary"
              size="mt-sm"
              className="w-full rounded-full"
              onClick={() => {
                setSheetStep("campus");
                setPendingCampusId(null);
                setSheetOpen(true);
              }}
            >
              Select campus
            </Button>
          </div>
        )}

        {confirmedCampusId !== null && inPersonSelectionComplete && (
          <div className="rounded-2xl border border-border bg-muted/30 p-4 flex items-center gap-3">
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

        <DateStrip
          dates={dates}
          slotsByDate={slotsByDate}
          crmAvailability={!isOnline ? crmAvailability : undefined}
          selectedDate={selectedDate}
          datePage={datePage}
          maxPage={maxPage}
          loadingSlots={loadingSlots}
          onDateSelect={handleDateSelect}
          onPageChange={setDatePage}
        />
        {!isOnline && Object.keys(crmAvailability).length > 0 && (
          <div className="flex items-center gap-5 text-[11px] text-muted-foreground -mt-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              Available
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              Not available
            </span>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-foreground mb-4">Available slots for {slotHeading}</h2>

          {loadingSlots ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : daySlots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{emptySlotMessage}</p>
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
      </div>

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
        loading={!isOnline && loadingBookingContext}
        testingCampuses={!isOnline && testingCampuses.length > 0 ? testingCampuses : undefined}
        onTestingConfirm={
          !isOnline && testingCampuses.length > 0
            ? (row) => {
                setConfirmedCampusId(row.campus_id);
                setConfirmedSubId(typeof row.sub_campus_id === "number" ? row.sub_campus_id : null);
              }
            : undefined
        }
      />

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard selected slot?</AlertDialogTitle>
            <AlertDialogDescription>
              You have already selected a slot. Switching to a different date will discard your
              current selection. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardCancel}>Keep current slot</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>Discard and switch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
