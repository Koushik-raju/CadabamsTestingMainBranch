'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Video, Building2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BackButton } from '@/components/common/back-button';
import { SlotSection } from './time-slot-picker';
import {
  getAppointmentsSlots,
  getAppointmentsSlotsBySlotIdPrice,
  putAppointmentsBookBySlotId,
  getDoctorsById,
} from '@/sdk/auth-and-crm';
import type { TimeSlot, DoctorDetail } from '@/sdk/auth-and-crm';

// ── helpers ────────────────────────────────────────────────────────────────────
function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function displayName(doctor: DoctorDetail | null): string {
  if (!doctor) return 'Doctor';
  const full = (doctor.display_name || doctor.name || '').trim();
  // Odoo display_name is "Company, DR NAME" — take only the part after the last comma
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

// ── BookingContent ─────────────────────────────────────────────────────────────
function BookingContent() {
  const router       = useRouter();
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const searchParams = useSearchParams();

  const campusId    = searchParams.get('campus_id')     ?? '';
  const subCampusId = searchParams.get('sub_campus_id') ?? '';
  const initMode    = searchParams.get('mode')          ?? 'online';

  const [doctor,       setDoctor]       = useState<DoctorDetail | null>(null);
  const [loadingDoc,   setLoadingDoc]   = useState(true);
  const [docError,     setDocError]     = useState<string | null>(null);

  // Next 14 days (stable after mount)
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
  const [booking,       setBooking]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Fetch doctor details
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
          campus_id:             campusId    ? Number(campusId)    : undefined,
          sub_campus_id:         subCampusId ? Number(subCampusId) : undefined,
        },
      });
      setSlots(res.data ?? []);
    } catch (err) {
      console.error(err);
      setError('Failed to load time slots. Please try again.');
    } finally {
      setLoadingSlots(false);
    }
  }, [doctor_id, campusId, subCampusId, dates]);

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

  const handleSessionToggle = (online: boolean) => {
    setIsOnline(online);
    fetchSlots(online ? 2 : 1);
  };

  const slotsByDate = useMemo(() => {
    const map: Record<string, TimeSlot[]> = {};
    for (const s of slots) {
      const key = s.start_datetime.slice(0, 10);
      (map[key] ??= []).push(s);
    }
    return map;
  }, [slots]);

  // Pagination: 10 dates per page
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

  const slotHeading = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const sessionDuration = slots[0]?.duration ?? null;

  const initials = (doctor?.display_name || doctor?.name || '')
    .replace(/^Dr\.?\s*/i, '')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const handleConfirm = async () => {
    if (!selectedSlot) { setError('Please select a time slot to continue.'); return; }
    setBooking(true);
    setError(null);
    try {
      await putAppointmentsBookBySlotId({
        path: { slotId: selectedSlot },
        body: {
          consultation_type_id: isOnline ? 2 : 1,
          campus_id:    campusId    ? Number(campusId)    : undefined,
          sub_campus_id: subCampusId ? Number(subCampusId) : undefined,
          payment_mode: 'online',
        },
      });
      const params = new URLSearchParams({
        id:                 doctor_id,
        name:               doctor?.display_name || doctor?.name || '',
        speciality:         specialityName(doctor),
        selectedTimeSlot:   String(selectedSlot),
        price:              String(slotPrice ?? ''),
        consultationTypeId: String(isOnline ? 2 : 1),
        mode:               isOnline ? 'online' : 'offline',
        date:               selectedDate.toISOString().split('T')[0],
      });
      if (campusId)    params.set('campusId',      campusId);
      if (subCampusId) params.set('sub_campus_id', subCampusId);
      router.push(`/checkout?${params.toString()}`);
    } catch (err) {
      console.error(err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
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

      <div className="flex-1 px-4 pb-32 space-y-5 max-w-xl mx-auto w-full">

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
          disabled={!selectedSlot || booking}
          className="rounded-full px-8 h-12 text-sm font-semibold"
        >
          {booking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Confirm booking
        </Button>
      </div>
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
