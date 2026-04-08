'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Video,
  Building2,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackButton } from '@/components/common/back-button';
import { useAuth } from '@/hooks/use-auth';
import { useBooking } from '@/contexts/booking-context';
import {
  getDoctorsById,
  getAppointmentsSlotsBySlotIdPrice,
  putAppointmentsBookBySlotId,
  postPaymentsAppointment,
} from '@/sdk/auth-and-crm';
import type { DoctorDetail } from '@/sdk/auth-and-crm';

function displayName(doctor: DoctorDetail | null): string {
  if (!doctor) return 'Doctor';
  const full = (doctor.display_name || doctor.name || '').trim();
  const raw = full.includes(',') ? full.split(',').pop()!.trim() : full;
  return /^Dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`;
}

function formatDatetime(iso: string | null): string {
  if (!iso) return '';
  try {
    return (
      new Date(iso).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) +
      ' at ' +
      new Date(iso).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  } catch {
    return '';
  }
}

function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    slotId,
    doctorId,
    campusId,
    subCampusId,
    consultationTypeId,
    startDatetime,
    clearBooking,
  } = useBooking();

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOnline = consultationTypeId === 2;

  useEffect(() => {
    if (!slotId || !doctorId) {
      router.replace('/find-therapist');
      return;
    }
    Promise.all([
      getDoctorsById({ path: { id: doctorId } }),
      getAppointmentsSlotsBySlotIdPrice({ path: { slotId } }),
    ])
      .then(([docRes, priceRes]) => {
        setDoctor(docRes.data ?? null);
        setPrice(priceRes.data?.price ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slotId, doctorId, router]);

  const handlePay = async () => {
    if (!slotId) return;
    setProcessing(true);
    setError(null);
    try {
      // Step 1: book the slot
      const isVirtual = consultationTypeId === 2;
      const resolvedCampusId = isVirtual ? 1 : (campusId ?? 1);

      const patientName = String(user?.name ?? user?.first_name ?? '');

      const bookRes = await putAppointmentsBookBySlotId({
        path: { slotId },
        body: {
          consultation_type_id: consultationTypeId as 1 | 2 | 3,
          campus_id: resolvedCampusId,
          sub_campus_id: isVirtual ? undefined : (subCampusId ?? undefined),
          lead_id: user?.lead_id ? Number(user.lead_id) : undefined,
          appointment_type: 'individual_appointment',
          availability: 'booked',
          caller_name: patientName,
          patient_name: patientName,
          payment_mode: 'online',
        },
      });

      if (bookRes.error) throw new Error(JSON.stringify(bookRes.error));
      if (!bookRes.data) throw new Error('Failed to book appointment.');

      // Step 2: initiate payment
      const payRes = await postPaymentsAppointment({
        body: {
          slot_id: slotId,
          campus_id: resolvedCampusId,
          lead_id: user?.lead_id ? Number(user.lead_id) : undefined,
          uid: user?.sub ?? '',
        },
      });

      if (payRes.error) throw new Error(JSON.stringify(payRes.error));

      const url = payRes.data?.result?.short_url;
      if (!url) throw new Error('No payment URL received from server.');

      clearBooking();
      router.push(url);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Payment initiation failed. Please try again.'
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-foreground">
          Appointment Confirmed!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your appointment with {displayName(doctor)} has been booked.
        </p>
        <p className="text-xs text-muted-foreground">
          Redirecting to your appointments…
        </p>
      </div>
    );
  }

  const initials = (doctor?.display_name || doctor?.name || '')
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <BackButton fallback="/find-therapist" />
        <h1 className="text-base font-semibold text-foreground">
          Confirm &amp; Pay
        </h1>
      </div>

      <div className="px-4 py-5 pb-32 max-w-2xl mx-auto space-y-4">
        {/* Doctor summary */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Appointment details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                {doctor?.image && (
                  <AvatarImage src={doctor.image} alt={displayName(doctor)} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials || <UserIcon className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">
                  {displayName(doctor)}
                </p>
                {doctor?.speciality_id?.[1] && (
                  <p className="text-sm text-muted-foreground">
                    {String(doctor.speciality_id[1])}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2.5 text-sm">
              {startDatetime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date &amp; Time</span>
                  <span className="font-medium text-foreground">
                    {formatDatetime(startDatetime)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  {isOnline ? (
                    <>
                      <Video className="h-3.5 w-3.5" /> Online
                    </>
                  ) : (
                    <>
                      <Building2 className="h-3.5 w-3.5" /> In-person
                    </>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price breakdown */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Payment summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Consultation fee</span>
              <span className="text-foreground">
                {price !== null ? `₹${price}` : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee</span>
              <span className="text-foreground">₹0</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold text-foreground">
              <span>Total</span>
              <span>{price !== null ? `₹${price}` : '—'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Logged-in user */}
        {user && (
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {String(user.caller_name ?? user.name ?? 'You')}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {String(user.caller_mobile ?? user.phone_number ?? '')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-2">
        <Button
          className="w-full rounded-full h-12 text-base font-semibold gap-2"
          disabled={processing || price === null}
          onClick={handlePay}
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CreditCard className="h-5 w-5" />
          )}
          {processing
            ? 'Redirecting to Razorpay…'
            : `Pay ${price !== null ? `₹${price}` : ''}`}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Secured by Razorpay · 256-bit SSL
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
