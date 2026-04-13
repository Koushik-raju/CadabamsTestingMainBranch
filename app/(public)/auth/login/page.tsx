'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import useSWRMutation from 'swr/mutation';
import { ArrowLeft, Heart, ShieldCheck } from 'lucide-react';
import { PhoneInput, type Country } from '@/components/common/phone-input';
import { OTPInput } from '@/components/common/otp-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

// ── Fetcher ───────────────────────────────────────────────

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

// ── Schema ────────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z.string().min(6, 'Enter a valid phone number'),
});
type PhoneForm = z.infer<typeof phoneSchema>;

// ── Brand hero shared across steps ───────────────────────

function AuthHero({ subtitle }: { subtitle: string }) {
  return (
    <div className="home-header-gradient px-6 pt-14 pb-10 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-[13px] font-bold text-white/90 tracking-[0.15em] uppercase">
          Cadabams
        </span>
      </div>
      <div>
        <h1 className="text-[26px] font-black text-white leading-tight">
          {subtitle}
        </h1>
        <p className="text-white/70 text-[13px] mt-1 font-medium">
          Mental health care, simplified.
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

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

  useEffect(() => {
    if (otp.length === 4) handleVerifyOtp(otp);
  }, [otp, handleVerifyOtp]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4f2]">
      {/* Hero */}
      <AuthHero subtitle={step === 'phone' ? 'Welcome back.' : 'Verify your number.'} />

      {/* Card — overlaps hero */}
      <div className="flex-1 bg-[#f6f4f2] rounded-t-3xl mt-[-20px] z-10 flex flex-col">
        <div className="px-5 pt-7 pb-6 flex flex-col gap-6 flex-1">

          {step === 'phone' ? (
            <>
              <div>
                <h2 className="text-[20px] font-black text-foreground">Sign in</h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Enter your registered phone number
                </p>
              </div>

              <form onSubmit={handleSubmit(onSendOtp)} className="flex flex-col gap-4">
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

                <Button type="submit" disabled={isSending} className="w-full h-12 rounded-xl font-semibold">
                  {isSending ? 'Sending…' : 'Send OTP'}
                </Button>
              </form>

              <p className="text-center text-[13px] text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/auth/signup${returnUrl ? `?returnUrl=${returnUrl}` : ''}`}
                  className="text-primary font-semibold"
                >
                  Sign up
                </Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); }}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground mb-4 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change number
                </button>
                <h2 className="text-[20px] font-black text-foreground">Enter the code</h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Sent to{' '}
                  <span className="font-semibold text-foreground">
                    +{country?.callingCode ?? '91'} {getValues('phone')}
                  </span>
                </p>
              </div>

              <OTPInput value={otp} onChange={setOtp} />

              <Button
                type="button"
                onClick={() => handleVerifyOtp(otp)}
                disabled={isVerifying || otp.length < 4}
                className="w-full h-12 rounded-xl font-semibold"
              >
                {isVerifying ? 'Verifying…' : 'Verify & Sign In'}
              </Button>

              <div className="flex justify-center text-[13px]">
                {timer > 0 ? (
                  <span className="text-muted-foreground">
                    Resend in <span className="tabular-nums font-semibold">{timer}s</span>
                  </span>
                ) : (
                  <button type="button" onClick={handleSubmit(onSendOtp)} className="text-primary font-semibold">
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

        </div>

        {/* Privacy note + links */}
        <div className="px-5 pb-8 flex flex-col items-center gap-3 mt-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary/60" />
            <span>Your data is encrypted and never shared</span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/term-and-condition" className="hover:text-foreground transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>

      {/* Redirect modal */}
      <Dialog open={redirectModal} onOpenChange={setRedirectModal}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Account not found</DialogTitle>
          <DialogDescription>
            We couldn&apos;t find an account with this number. Would you like to sign up?
          </DialogDescription>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setRedirectModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => router.push(`/auth/signup?mobile=${getValues('phone')}`)}
              className="flex-1"
            >
              Sign Up
            </Button>
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
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
