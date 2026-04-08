'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Video, Building2, Loader2, AlertCircle, MapPin, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BackButton } from '@/components/common/back-button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SlotSection } from './time-slot-picker';
import { useBooking } from '@/contexts/booking-context';
import {
  getAppointmentsSlots,
  getAppointmentsSlotsBySlotIdPrice,
  getDoctorsById,
  getMastersCampuses,
  getDoctorsByIdAvailability,
} from '@/sdk/auth-and-crm';
import type { TimeSlot, DoctorDetail, CampusMaster, DoctorAvailabilityResponse } from '@/sdk/auth-and-crm';

// ── helpers ────────────────────────────────────────────────────────────────────
function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function displayName(doctor: DoctorDetail | null): string {
  if (!doctor) return 'Doctor';
  const full = (doctor.display_name || doctor.name || '').trim();
  const raw = full.includes(',') ? full.split(',').pop()!.trim() : full;
  if (!raw) return 'Doctor';
  return /^Dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`;
}

function specialityName(doctor: DoctorDetail | null): string {
  if (!doctor) return '';
  return String(doctor.speciality_id?.[1] ?? '');
}

type AvailStatus = 'available' | 'few-left' | 'no-slots' | 'full';

function getAvailStatus(count: number): AvailStatus {
  if (count === 0) return 'no-slots';
  if (count <= 2) return 'few-left';
  return 'available';
}

const AVAIL_CFG: Record<AvailStatus, { label: string; cls: string }> = {
  available:  { label: 'Available', cls: 'bg-green-100  text-green-700' },
  'few-left': { label: 'Few left',  cls: 'bg-orange-100 text-orange-600' },
  'no-slots': { label: 'No slots',  cls: 'bg-red-100    text-red-600' },
  full:       { label: 'Full',      cls: 'bg-red-100    text-red-600' },
};

// ── DateTile ───────────────────────────────────────────────────────────────────
function DateTile({
  date, slotCount, isSelected, onClick,
}: {
  date: Date; slotCount: number; isSelected: boolean; onClick: () => void;
}) {
  const status = getAvailStatus(slotCount);
  const { label, cls } = AVAIL_CFG[status];
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum  = date.getDate();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 py-2 rounded-xl flex-1 min-w-0 transition-all',
        isSelected ? 'bg-primary' : 'hover:bg-muted/40',
      )}
    >
      <span className={cn(
        'text-[11px] font-medium',
        isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
      )}>
        {dayName}
      </span>
      <span className={cn(
        'text-lg font-bold leading-none',
        isSelected ? 'text-primary-foreground' : 'text-foreground',
      )}>
        {dayNum}
      </span>
      <span className={cn(
        'text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-tight',
        isSelected ? 'bg-white/20 text-white' : cls,
      )}>
        {label}
      </span>
    </button>
  );
}

// ── CheckIcon ──────────────────────────────────────────────────────────────────
function CheckDot() {
  return (
    <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// ── BookingContent ─────────────────────────────────────────────────────────────
function BookingContent() {
  const router        = useRouter();
  const { setBooking } = useBooking();
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const searchParams  = useSearchParams();

  const initMode = searchParams.get('mode') ?? 'online';

  // ── doctor ──────────────────────────────────────────────────────────────────
  const [doctor,       setDoctor]       = useState<DoctorDetail | null>(null);
  const [loadingDoc,   setLoadingDoc]   = useState(true);
  const [docError,     setDocError]     = useState<string | null>(null);

  // ── all campuses + doctor availability ──────────────────────────────────────
  const [campuses,      setCampuses]      = useState<CampusMaster[]>([]);
  const [availability,  setAvailability]  = useState<DoctorAvailabilityResponse | null>(null);
  const [loadingMeta,   setLoadingMeta]   = useState(true);

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

  const [isOnline,      setIsOnline]      = useState(initMode !== 'offline');
  const [datePage,      setDatePage]      = useState(0);
  const [selectedDate,  setSelectedDate]  = useState<Date>(dates[0]);
  const [slots,         setSlots]         = useState<TimeSlot[]>([]);
  const [selectedSlot,  setSelectedSlot]  = useState<number | null>(null);
  const [slotPrice,     setSlotPrice]     = useState<number | null>(null);
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // ── campus sheet ─────────────────────────────────────────────────────────────
  const [sheetOpen,         setSheetOpen]         = useState(false);
  const [sheetStep,         setSheetStep]         = useState<'campus' | 'sub-campus'>('campus');
  const [pendingCampusId,   setPendingCampusId]   = useState<number | null>(null);
  const [confirmedCampusId, setConfirmedCampusId] = useState<number | null>(null);
  const [confirmedSubId,    setConfirmedSubId]     = useState<number | null>(null);

  // ── fetch doctor ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!doctor_id) return;
    setLoadingDoc(true);
    getDoctorsById({ path: { id: Number(doctor_id) } })
      .then(r => {
        if (r.error || !r.data) throw new Error('Not found');
        setDoctor(r.data);
      })
      .catch(() => setDocError('Failed to load doctor details.'))
      .finally(() => setLoadingDoc(false));
  }, [doctor_id]);

  // ── fetch campuses + doctor availability in parallel ─────────────────────────
  useEffect(() => {
    if (!doctor_id) return;
    setLoadingMeta(true);
    Promise.all([
      getMastersCampuses(),
      getDoctorsByIdAvailability({ path: { id: Number(doctor_id) } }),
    ]).then(([campusRes, availRes]) => {
      setCampuses((Array.isArray(campusRes.data) ? campusRes.data : []).filter(c => c.book_appointment));
      setAvailability(availRes.data ?? null);
    }).catch(() => {}).finally(() => setLoadingMeta(false));
  }, [doctor_id]);

  // ── fetch slots ───────────────────────────────────────────────────────────────
  const fetchSlots = useCallback(async (consultTypeId: number) => {
    if (!doctor_id) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    setSlotPrice(null);
    setError(null);
    try {
      const start = new Date(dates[0]);
      const end   = new Date(dates[dates.length - 1]);
      end.setHours(23, 59, 59, 999);
      const res = await getAppointmentsSlots({
        query: {
          doctor_id:             Number(doctor_id),
          availability:          'open',
          start_datetime:        start.toISOString(),
          stop_datetime:         end.toISOString(),
          consultation_type_ids: consultTypeId,
        },
      });
      setSlots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load time slots. Please try again.');
    } finally {
      setLoadingSlots(false);
    }
  }, [doctor_id, dates]);

  useEffect(() => {
    fetchSlots(isOnline ? 2 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSlot === null) { setSlotPrice(null); return; }
    getAppointmentsSlotsBySlotIdPrice({ path: { slotId: selectedSlot } })
      .then(r => setSlotPrice(r.data?.price ?? null))
      .catch(() => setSlotPrice(null));
  }, [selectedSlot]);

  // ── open sheet when slot is picked (in-person only) ─────────────────────────
  useEffect(() => {
    if (selectedSlot !== null && !isOnline) {
      setSheetStep('campus');
      setPendingCampusId(null);
      setSheetOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot]);

  const handleSessionToggle = (online: boolean) => {
    setIsOnline(online);
    setConfirmedCampusId(null);
    setConfirmedSubId(null);
    fetchSlots(online ? 2 : 1);
  };

  // ── derived availability sets ─────────────────────────────────────────────────
  const availableCampusIds = useMemo(
    () => new Set((availability?.campuses ?? []).map(c => c.campus_id)),
    [availability],
  );

  // Returns sub-campus options for a given campus:
  // prefers availability data; falls back to CampusMaster.area
  const getSubCampusOptions = useCallback((campusId: number) => {
    const fromAvailability = (availability?.campuses ?? [])
      .filter(c => c.campus_id === campusId && c.sub_campus_id !== false)
      .map(c => ({ id: c.sub_campus_id as number, name: c.name }));
    if (fromAvailability.length > 0) return fromAvailability;
    const master = campuses.find(c => c.id === campusId);
    return (master?.area ?? []).map(([id, name]) => ({ id: Number(id), name: String(name) }));
  }, [availability, campuses]);

  const subCampusesForPending = useMemo(
    () => pendingCampusId !== null ? getSubCampusOptions(pendingCampusId) : [],
    [pendingCampusId, getSubCampusOptions],
  );

  // ── campus sheet handlers ─────────────────────────────────────────────────────
  const handleCampusPick = (campusId: number) => {
    setPendingCampusId(campusId);
    if (isOnline) {
      setConfirmedCampusId(campusId);
      setConfirmedSubId(null);
      setSheetOpen(false);
    } else {
      const subs = getSubCampusOptions(campusId);
      if (subs.length === 0) {
        // No sub-campuses — confirm campus directly
        setConfirmedCampusId(campusId);
        setConfirmedSubId(null);
        setSheetOpen(false);
      } else {
        setSheetStep('sub-campus');
      }
    }
  };

  const handleSubCampusPick = (subId: number) => {
    setConfirmedCampusId(pendingCampusId);
    setConfirmedSubId(subId);
    setSheetOpen(false);
  };

  // ── derived display values ───────────────────────────────────────────────────
  const slotsByDate = useMemo(() => {
    const map: Record<string, TimeSlot[]> = {};
    for (const s of slots) {
      const key = s.start_datetime.slice(0, 10);
      (map[key] ??= []).push(s);
    }
    return map;
  }, [slots]);

  const maxPage      = Math.ceil(dates.length / 10) - 1;
  const visibleDates = dates.slice(datePage * 10, datePage * 10 + 10);
  const dateRow1     = visibleDates.slice(0, 5);
  const dateRow2     = visibleDates.slice(5, 10);
  const monthLabel   = visibleDates[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) ?? '';

  const selectedKey    = toDateKey(selectedDate);
  const daySlots       = slotsByDate[selectedKey] ?? [];
  const morningSlots   = daySlots.filter(s => new Date(s.start_datetime).getHours() < 12);
  const afternoonSlots = daySlots.filter(s => { const h = new Date(s.start_datetime).getHours(); return h >= 12 && h < 17; });
  const eveningSlots   = daySlots.filter(s => new Date(s.start_datetime).getHours() >= 17);

  const slotHeading    = selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const sessionDuration = slots[0]?.duration ?? null;

  const initials = (doctor?.display_name || doctor?.name || '')
    .replace(/^Dr\.?\s*/i, '')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const confirmedCampusName = confirmedCampusId !== null
    ? campuses.find(c => c.id === confirmedCampusId)?.display_name
      || campuses.find(c => c.id === confirmedCampusId)?.name
      || null
    : null;

  const confirmedSubName = useMemo(() => {
    if (confirmedSubId === null || confirmedCampusId === null) return null;
    return getSubCampusOptions(confirmedCampusId).find(s => s.id === confirmedSubId)?.name ?? null;
  }, [confirmedSubId, confirmedCampusId, getSubCampusOptions]);

  // ── confirm booking ───────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!selectedSlot)                { setError('Please select a time slot to continue.'); return; }
    if (!isOnline && !confirmedCampusId) { setError('Please select a campus to continue.'); return; }
    const hasSubs = !isOnline && confirmedCampusId ? getSubCampusOptions(confirmedCampusId).length > 0 : false;
    if (hasSubs && !confirmedSubId) { setError('Please select a center to continue.'); return; }
    const slot = slots.find(s => s.id === selectedSlot);
    setBooking({
      slotId:             selectedSlot,
      doctorId:           Number(doctor_id),
      campusId:           confirmedCampusId,
      subCampusId:        isOnline ? null : confirmedSubId,
      consultationTypeId: isOnline ? 2 : 1,
      startDatetime:      slot?.start_datetime ?? null,
    });
    router.push('/checkout');
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
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <BackButton fallback="/find-therapist" />
        <h1 className="text-base font-semibold">Select a slot</h1>
      </div>

      <div className="flex-1 px-4 pb-36 space-y-5 max-w-xl mx-auto w-full">

        {/* ── Doctor card ── */}
        <div className="rounded-2xl border border-border bg-background p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-11 w-11 shrink-0 rounded-xl">
              {doctor?.image && <AvatarImage src={doctor.image} alt={displayName(doctor)} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm rounded-xl">
                {initials || 'DR'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{displayName(doctor)}</p>
              <p className="text-xs text-muted-foreground leading-snug">
                {[specialityName(doctor), sessionDuration ? `${sessionDuration} min session` : null]
                  .filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-orange-50 rounded-xl p-2.5">
            {isOnline
              ? <Video className="h-4 w-4 text-primary" />
              : <Building2 className="h-4 w-4 text-primary" />}
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
                'px-4 py-1.5 rounded-md transition-all',
                isOnline ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              Online
            </button>
            <button
              type="button"
              onClick={() => handleSessionToggle(false)}
              className={cn(
                'px-4 py-1.5 rounded-md transition-all',
                !isOnline ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              In-person
            </button>
          </div>
        </div>

        {/* ── Date strip ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={datePage === 0}
                onClick={() => setDatePage(p => Math.max(0, p - 1))}
                className="p-1.5 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={datePage >= maxPage}
                onClick={() => setDatePage(p => Math.min(maxPage, p + 1))}
                className="p-1.5 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1">
            {dateRow1.map(date => {
              const key = toDateKey(date);
              return (
                <DateTile
                  key={key}
                  date={date}
                  slotCount={loadingSlots ? 0 : (slotsByDate[key]?.length ?? 0)}
                  isSelected={selectedKey === key}
                  onClick={() => setSelectedDate(date)}
                />
              );
            })}
          </div>

          {dateRow2.length > 0 && (
            <div className="flex gap-1 mt-1">
              {dateRow2.map(date => {
                const key = toDateKey(date);
                return (
                  <DateTile
                    key={key}
                    date={date}
                    slotCount={loadingSlots ? 0 : (slotsByDate[key]?.length ?? 0)}
                    isSelected={selectedKey === key}
                    onClick={() => setSelectedDate(date)}
                  />
                );
              })}
              {Array.from({ length: 5 - dateRow2.length }).map((_, i) => (
                <div key={i} className="flex-1" />
              ))}
            </div>
          )}
        </div>

        {/* ── Slots ── */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">
            Available slots for {slotHeading}
          </h2>

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
              <SlotSection title="Morning"   slots={morningSlots}   selectedId={selectedSlot} onSelect={setSelectedSlot} />
              <SlotSection title="Afternoon" slots={afternoonSlots} selectedId={selectedSlot} onSelect={setSelectedSlot} />
              <SlotSection title="Evening"   slots={eveningSlots}   selectedId={selectedSlot} onSelect={setSelectedSlot} />
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
              <p className="text-sm font-semibold text-foreground truncate">{confirmedCampusName}</p>
              {confirmedSubName && (
                <p className="text-xs text-muted-foreground truncate">{confirmedSubName}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSheetStep('campus'); setPendingCampusId(null); setSheetOpen(true); }}
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
                Per{sessionDuration ? ` ${sessionDuration} min` : ''} session
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a slot</p>
          )}
        </div>
        <Button
          onClick={handleConfirm}
          disabled={!selectedSlot || (!isOnline && (
            !confirmedCampusId ||
            (confirmedCampusId !== null && getSubCampusOptions(confirmedCampusId).length > 0 && !confirmedSubId)
          ))}
          className="rounded-full px-8 h-12 text-sm font-semibold"
        >
          Confirm booking
        </Button>
      </div>

      {/* ── Campus / Sub-campus Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" showCloseButton className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-8">

          {sheetStep === 'campus' && (
            <>
              <SheetHeader className="pb-2">
                <SheetTitle>Select a campus</SheetTitle>
                <p className="text-sm text-muted-foreground">Choose where you&apos;d like your session</p>
              </SheetHeader>

              {loadingMeta ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : campuses.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4 py-6 text-center">No campuses available.</p>
              ) : (
                <div className="flex flex-col gap-2 px-4 pt-2">
                  {campuses.map(campus => {
                    const doctorAvailable = availableCampusIds.size === 0 || availableCampusIds.has(campus.id);
                    const isSelected = pendingCampusId === campus.id;
                    return (
                      <button
                        key={campus.id}
                        type="button"
                        disabled={!doctorAvailable}
                        onClick={() => handleCampusPick(campus.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                          !doctorAvailable && 'opacity-40 cursor-not-allowed',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : doctorAvailable
                              ? 'border-border bg-background hover:bg-muted/40'
                              : 'border-border bg-background',
                        )}
                      >
                        <Building2 className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected ? 'text-primary' : 'text-muted-foreground',
                        )} />
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            isSelected ? 'text-primary' : 'text-foreground',
                          )}>
                            {campus.display_name || campus.name}
                          </p>
                          {campus.city?.[1] && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {String(campus.city[1])}
                            </p>
                          )}
                          {!doctorAvailable && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">Not available at this campus</p>
                          )}
                        </div>
                        {isSelected
                          ? <CheckDot />
                          : !isOnline && doctorAvailable && (
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          )
                        }
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {sheetStep === 'sub-campus' && (
            <>
              <SheetHeader className="pb-2">
                <button
                  type="button"
                  onClick={() => setSheetStep('campus')}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1 -ml-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <SheetTitle>Select a center</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {campuses.find(c => c.id === pendingCampusId)?.display_name
                    || campuses.find(c => c.id === pendingCampusId)?.name}
                </p>
              </SheetHeader>

              <div className="flex flex-col gap-2 px-4 pt-2">
                {subCampusesForPending.map(sub => {
                  const isSelected = confirmedSubId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubCampusPick(sub.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:bg-muted/40',
                      )}
                    >
                      <Building2 className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'text-primary' : 'text-muted-foreground',
                      )} />
                      <span className={cn(
                        'flex-1 text-sm font-medium truncate',
                        isSelected ? 'text-primary' : 'text-foreground',
                      )}>
                        {sub.name}
                      </span>
                      {isSelected && <CheckDot />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
