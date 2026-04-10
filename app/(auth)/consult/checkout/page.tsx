'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BackButton } from '@/components/shared/navigation/back-button';
import { BookingSummaryCard } from '@/components/checkout/booking-summary-card';
import { PaymentSummaryCard } from '@/components/checkout/payment-summary-card';
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

      window.location.href = url;
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
        <BookingSummaryCard
          doctor={doctor}
          startDatetime={startDatetime}
          isOnline={isOnline}
        />

        {/* Price breakdown */}
        <PaymentSummaryCard price={price} />

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
