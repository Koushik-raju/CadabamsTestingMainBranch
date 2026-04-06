'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import useSWRMutation from 'swr/mutation';
import { PhoneInput, type Country } from '@/components/common/phone-input';
import { OTPInput } from '@/components/common/otp-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, MessageCircle } from 'lucide-react';

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function postJson<T>(url: string, { arg }: { arg: T }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z.string().min(6, 'Enter a valid phone number'),
});
type PhoneForm = z.infer<typeof phoneSchema>;

// ── Page ──────────────────────────────────────────────────────────────────────

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [country, setCountry] = useState<Country | null>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [redirectModal, setRedirectModal] = useState(false);

  const returnUrl = searchParams.get('returnUrl') ?? '';

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const { trigger: sendOtp, isMutating: isSending } = useSWRMutation('/api/auth/send-otp', postJson);
  const { trigger: verifyOtp, isMutating: isVerifying } = useSWRMutation('/api/auth/verify-login', postJson);

  // Resend timer countdown
  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const onSendOtp = async ({ phone }: PhoneForm) => {
    try {
      await sendOtp({ phone, type: 'login' });
      toast.success('OTP sent successfully');
      setStep('otp');
      setTimer(30);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 404) { setRedirectModal(true); return; }
      if (e.status === 400) { toast.error('Invalid phone number'); return; }
      toast.error('Failed to send OTP. Try again.');
    }
  };

  const handleVerifyOtp = useCallback(async (code: string) => {
    if (code.length < 4) return;
    try {
      await verifyOtp({ phone: getValues('phone'), otp: code });
      toast.success('Welcome back!');
      login().catch(() => {});
      router.replace('/home');
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 401) { toast.error('Invalid OTP. Try again.'); setOtp(''); return; }
      if (e.status === 404) { toast.error('Account not found'); setRedirectModal(true); return; }
      toast.error('Something went wrong. Try again.');
      setOtp('');
    }
  }, [verifyOtp, getValues, login, router]);

  // Auto-submit when all 4 digits entered
  useEffect(() => {
    if (otp.length === 4) handleVerifyOtp(otp);
  }, [otp, handleVerifyOtp]);

  return (
    <div className="min-h-screen bg-[#f6f4f2] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-sm text-muted-foreground font-medium tracking-wide">CADABAMS</span>
      </div>

      <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Step progress */}
        <div className="flex h-1">
          <div className="flex-1 bg-primary" />
          <div className={`flex-1 transition-colors duration-300 ${step === 'otp' ? 'bg-primary' : 'bg-border'}`} />
        </div>

        <div className="p-6 flex flex-col gap-6">
          {step === 'phone' ? (
            <form onSubmit={handleSubmit(onSendOtp)} className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter your phone number to continue</p>
              </div>

              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5">
                    <PhoneInput
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      selectedCountry={country}
                      onCountryChange={setCountry}
                    />
                    {fieldState.error && (
                      <p className="text-xs text-destructive">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />

              <Button type="submit" disabled={isSending} className="w-full h-11">
                {isSending ? 'Sending…' : 'Send OTP'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href={`/signup${returnUrl ? `?returnUrl=${returnUrl}` : ''}`} className="text-primary font-medium">
                  Sign up
                </Link>
              </p>
            </form>
          ) : (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change number
                </button>
                <h1 className="text-xl font-semibold text-foreground">Enter OTP</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Sent to{' '}
                  <span className="font-medium text-foreground">
                    +{country?.callingCode ?? '91'} {getValues('phone')}
                  </span>
                </p>
              </div>

              <OTPInput value={otp} onChange={setOtp} />

              <Button
                type="button"
                onClick={() => handleVerifyOtp(otp)}
                disabled={isVerifying || otp.length < 4}
                className="w-full h-11"
              >
                {isVerifying ? 'Verifying…' : 'Verify OTP'}
              </Button>

              <div className="flex justify-end text-sm">
                {timer > 0 ? (
                  <span className="text-muted-foreground">
                    Resend in <span className="tabular-nums">{timer}s</span>
                  </span>
                ) : (
                  <button type="button" onClick={handleSubmit(onSendOtp)} className="text-primary font-medium">
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-center gap-4 text-xs text-muted-foreground border-t border-border pt-4">
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/term-and-condition" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
        </div>
      </div>

      <Dialog open={redirectModal} onOpenChange={setRedirectModal}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Account not found</DialogTitle>
          <DialogDescription>
            We couldn&apos;t find an account with this number. Would you like to sign up?
          </DialogDescription>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setRedirectModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => router.push(`/signup?mobile=${getValues('phone')}`)} className="flex-1">Sign Up</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f6f4f2] flex items-center justify-center">
        <Skeleton className="h-[420px] w-80 rounded-2xl" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
