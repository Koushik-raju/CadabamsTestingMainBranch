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
import { useAuth } from '@/hooks/shared/auth/use-auth';
import { useBooking } from '@/contexts/booking-context';
import {
  crmControllerGetDoctorById,
  crmControllerGetSlotPrice,
  appointmentsControllerBookIndividual,
  crmControllerRazorpayPayment,
} from '@/sdk/backend-v2';
import type { DoctorResponseDto } from '@/sdk/backend-v2';

function displayName(doctor: DoctorResponseDto | null): string {
  if (!doctor) return 'Doctor';
  const raw = (doctor.name || '').trim();
  const name = raw.includes(',') ? raw.split(',').pop()!.trim() : raw;
  return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
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

  const [doctor, setDoctor] = useState<DoctorResponseDto | null>(null);
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
      crmControllerGetDoctorById({ path: { id: doctorId } }),
      crmControllerGetSlotPrice({ path: { id: slotId } }),
    ])
      .then(([docRes, priceRes]) => {
        setDoctor((docRes.data as DoctorResponseDto | undefined) ?? null);
        const pd = priceRes.data as { price?: number } | undefined;
        setPrice(pd?.price ?? null);
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
      const leadId = user?.lead_id ? Number(user.lead_id) : 0;
      const uid = (user as Record<string, unknown>)?.sub as string ?? '';

      await appointmentsControllerBookIndividual({
        path: { campus: 'cadabams', id: slotId },
        body: {
          slotId,
          lead_id: leadId,
          campus_id: resolvedCampusId,
          sub_campus_id: isVirtual ? undefined : (subCampusId ?? undefined),
          consultation_type_id: consultationTypeId ?? undefined,
          payment_method: 'online',
        },
      });

      // Step 2: initiate Razorpay payment
      const payRes = await crmControllerRazorpayPayment({
        body: {
          slot_id: slotId,
          campus_id: resolvedCampusId,
          lead_id: leadId,
          uid,
        },
      });

      const payData = payRes.data as { razorpay_order_id?: string; amount?: number; key_id?: string } | undefined;
      if (!payData?.razorpay_order_id) throw new Error('Payment initiation failed — no order ID received.');

      // Razorpay inline checkout
      const options = {
        key: payData.key_id,
        amount: payData.amount,
        currency: 'INR',
        order_id: payData.razorpay_order_id,
        handler: () => { router.push('/consult/appointments'); },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Razorpay = (window as unknown as Record<string, unknown>).Razorpay as (new (opts: unknown) => { open(): void }) | undefined;
      if (!Razorpay) throw new Error('Razorpay SDK not loaded.');
      new Razorpay(options).open();
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

  const initials = (doctor?.name || '')
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <BackButton fallback="/consult/find-therapist" />
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
