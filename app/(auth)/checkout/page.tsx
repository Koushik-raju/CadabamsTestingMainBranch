'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BackButton } from '@/components/common/back-button';
import { paymentService } from '@/services/payment.service';
import { useAuth } from '@/hooks/use-auth';


function displayName(name: string): string {
  const raw = name.trim();
  if (!raw) return 'Doctor';
  return /^Dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const doctorId    = searchParams.get('id') ?? '';
  const doctorName  = searchParams.get('name') ?? '';
  const speciality  = searchParams.get('speciality') ?? '';
  const slotId      = searchParams.get('selectedTimeSlot') ?? '';
  const price       = searchParams.get('price') ?? '0';
  const ctId        = searchParams.get('consultationTypeId') ?? '2';
  const mode        = searchParams.get('mode') ?? 'online';
  const dateStr     = searchParams.get('date') ?? '';
  const campusId    = searchParams.get('campusId') ?? '';
  const subCampus   = searchParams.get('sub_campus_id') ?? '';

  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  const priceAmount = parseFloat(price) || 0;

  const initials = doctorName
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleWebPayment = async (orderData: Record<string, unknown>) => {
    return new Promise<void>((resolve, reject) => {
      const options = {
        key:         orderData.key_id ?? orderData.key ?? '',
        amount:      orderData.amount ?? priceAmount * 100,
        currency:    'INR',
        name:        'Cadabams MindTalk',
        description: `Consultation with ${displayName(doctorName)}`,
        order_id:    orderData.order_id ?? orderData.id ?? '',
        prefill: {
          name:    String(user?.caller_name ?? user?.name ?? ''),
          email:   String(user?.email ?? ''),
          contact: String(user?.caller_mobile ?? user?.phone_number ?? ''),
        },
        theme: { color: '#E7590F' },
        handler: (response: Record<string, unknown>) => {
          resolve();
          paymentService.razorpayCallback({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_signature:  response.razorpay_signature,
          }).catch(console.error);
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      };

      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        reject(new Error('Razorpay not loaded'));
        return;
      }
      const rzp = new RazorpayCtor(options);
      rzp.open();
    });
  };

  const handleCapacitorPayment = async (orderData: Record<string, unknown>) => {
    type RazorpayMod = { Checkout: { open(o: Record<string, unknown>): Promise<Record<string, unknown>> } };
    let mod: RazorpayMod | null = null;
    try {
      // eslint-disable-next-line no-new-func
      mod = await (new Function('s', 'return import(s)'))('capacitor-razorpay') as RazorpayMod;
    } catch {
      setError('Native payment not available.');
      return;
    }
    if (!mod) { setError('Native payment not available.'); return; }
    const { Checkout } = mod;
    const result = await Checkout.open({
      key:             String(orderData.key_id ?? orderData.key ?? ''),
      amount:          String(orderData.amount ?? priceAmount * 100),
      currency:        'INR',
      name:            'Cadabams MindTalk',
      description:     `Consultation with ${displayName(doctorName)}`,
      order_id:        String(orderData.order_id ?? orderData.id ?? ''),
      prefill_name:    String(user?.caller_name ?? user?.name ?? ''),
      prefill_contact: String(user?.caller_mobile ?? user?.phone_number ?? ''),
    });
    await paymentService.razorpayCallback({
      razorpay_payment_id: result.razorpay_payment_id,
      razorpay_order_id:   result.razorpay_order_id,
      razorpay_signature:  result.razorpay_signature,
    });
  };

  const handlePay = async () => {
    if (!user?.lead_id) {
      setError('Please log in to complete payment.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const orderRes = await paymentService.createRazorpayOrder({
        amount:               priceAmount * 100,
        currency:             'INR',
        lead_id:              user.lead_id,
        slot_id:              slotId,
        doctor_id:            doctorId,
        consultation_type_id: ctId,
        campus_id:            campusId || undefined,
        sub_campus_id:        subCampus || undefined,
      });
      const orderData = orderRes as Record<string, unknown>;

      const isNative =
        typeof window !== 'undefined' &&
        !!(window as unknown as Record<string, unknown>).Capacitor &&
        !!((window as unknown as Record<string, unknown>).Capacitor as Record<string, unknown>).isNative;

      if (isNative) {
        await handleCapacitorPayment(orderData);
      } else {
        await handleWebPayment(orderData);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/appointments');
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      if (msg !== 'Payment cancelled') {
        setError(msg);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-foreground">Appointment Confirmed!</h2>
        <p className="text-sm text-muted-foreground">
          Your appointment with {displayName(doctorName)} has been booked.
        </p>
        <p className="text-xs text-muted-foreground">Redirecting to your appointments…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <BackButton fallback="/find-therapist" />
        <h1 className="text-base font-semibold text-foreground">Confirm & Pay</h1>
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
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials || <UserIcon className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{displayName(doctorName)}</p>
                {speciality && <p className="text-sm text-muted-foreground">{speciality}</p>}
              </div>
            </div>

            <Separator />

            <div className="space-y-2.5 text-sm">
              {dateStr && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground">{formatDate(dateStr)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="flex items-center gap-1 font-medium text-foreground capitalize">
                  {mode === 'online'
                    ? <><Video className="h-3.5 w-3.5" /> Online</>
                    : <><Building2 className="h-3.5 w-3.5" /> In-person</>}
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
              <span className="text-foreground">₹{priceAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee</span>
              <span className="text-foreground">₹0</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold text-foreground">
              <span>Total</span>
              <span>₹{priceAmount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Who you're logged in as */}
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

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Fixed pay CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-2">
        <Button
          className="w-full rounded-full h-12 text-base font-semibold gap-2"
          disabled={processing || priceAmount === 0}
          onClick={handlePay}
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CreditCard className="h-5 w-5" />
          )}
          {processing ? 'Processing payment…' : `Pay ₹${priceAmount}`}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
