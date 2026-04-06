'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Video,
  Building2,
  Loader2,
  AlertCircle,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { BackButton } from '@/components/common/back-button';
import { TimeSlotPicker } from './time-slot-picker';
import {
  getAppointmentsSlots,
  getAppointmentsSlotsBySlotIdPrice,
  putAppointmentsBookBySlotId,
} from '@/sdk/auth-and-crm';
import type { TimeSlot } from '@/sdk/auth-and-crm';

function displayName(name: string): string {
  const raw = name.trim();
  if (!raw) return 'Doctor';
  return /^Dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`;
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const doctorId     = searchParams.get('id') ?? '';
  const doctorName   = searchParams.get('name') ?? '';
  const speciality   = searchParams.get('speciality') ?? '';
  const mode         = searchParams.get('mode') ?? 'online';
  const campusId     = searchParams.get('campus_id') ?? '';
  const subCampusId  = searchParams.get('sub_campus_id') ?? '';
  const ctId         = Number(searchParams.get('consultationTypeId') ?? (mode === 'online' ? '2' : '1'));

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots]               = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [slotPrice, setSlotPrice]       = useState<number | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const fetchSlots = useCallback(async (date: Date) => {
    if (!doctorId) return;
    setLoadingSlots(true);
    setError(null);
    setSlots([]);
    setSelectedSlot(null);
    setSlotPrice(null);
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const res = await getAppointmentsSlots({
        query: {
          doctor_id:            Number(doctorId),
          availability:         'open',
          start_datetime:       startOfDay.toISOString(),
          stop_datetime:        endOfDay.toISOString(),
          consultation_type_ids: ctId,
          campus_id:            campusId ? Number(campusId) : undefined,
          sub_campus_id:        subCampusId ? Number(subCampusId) : undefined,
        },
      });
      setSlots(res.data ?? []);
    } catch (err) {
      console.error(err);
      setError('Failed to load time slots. Please try again.');
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId, ctId, campusId, subCampusId]);

  useEffect(() => {
    fetchSlots(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch price when a slot is selected
  useEffect(() => {
    if (selectedSlot === null) { setSlotPrice(null); return; }
    getAppointmentsSlotsBySlotIdPrice({ path: { slotId: selectedSlot } })
      .then((res) => setSlotPrice(res.data?.price ?? null))
      .catch(() => setSlotPrice(null));
  }, [selectedSlot]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    fetchSlots(date);
  };

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot to continue.');
      return;
    }
    setBooking(true);
    setError(null);
    try {
      await putAppointmentsBookBySlotId({
        path: { slotId: selectedSlot },
        body: {
          consultation_type_id: ctId,
          campus_id:   campusId    ? Number(campusId)    : undefined,
          sub_campus_id: subCampusId ? Number(subCampusId) : undefined,
          payment_mode: 'online',
        },
      });

      const dateStr = selectedDate.toISOString().split('T')[0];
      const params = new URLSearchParams();
      params.set('id',                 doctorId);
      params.set('name',               doctorName);
      params.set('speciality',         speciality);
      params.set('selectedTimeSlot',   String(selectedSlot));
      params.set('price',              String(slotPrice ?? ''));
      params.set('consultationTypeId', String(ctId));
      params.set('mode',               mode);
      params.set('date',               dateStr);
      if (campusId)    params.set('campusId',     campusId);
      if (subCampusId) params.set('sub_campus_id', subCampusId);
      router.push(`/checkout?${params.toString()}`);
    } catch (err) {
      console.error(err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const initials = doctorName
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <BackButton fallback="/find-therapist" />
        <h1 className="text-base font-semibold text-foreground">Book Appointment</h1>
      </div>

      <div className="px-4 py-5 pb-28 max-w-2xl mx-auto space-y-5">
        {/* Doctor info card */}
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials || 'DR'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{displayName(doctorName)}</p>
              {speciality && <p className="text-sm text-muted-foreground">{speciality}</p>}
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                {mode === 'online' ? (
                  <><Video className="h-3.5 w-3.5" /> Online session</>
                ) : (
                  <><Building2 className="h-3.5 w-3.5" /> In-person session</>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date picker */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Select date
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-xl"
            />
          </CardContent>
        </Card>

        {/* Time slots */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Select time slot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSlotPicker
              slots={slots}
              selectedId={selectedSlot}
              onSelect={setSelectedSlot}
              loading={loadingSlots}
            />
          </CardContent>
        </Card>

        {/* Price summary */}
        {slotPrice !== null && (
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Consultation fee</span>
                <span className="font-semibold text-foreground">₹{slotPrice}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>₹{slotPrice}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Fixed confirm CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          className="w-full rounded-full h-12 text-base font-semibold"
          disabled={!selectedSlot || booking}
          onClick={handleConfirm}
        >
          {booking ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {booking ? 'Processing…' : 'Confirm & Continue'}
        </Button>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
