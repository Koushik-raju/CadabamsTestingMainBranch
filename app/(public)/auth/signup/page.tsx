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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    'Invalid email address'
  ).optional(),
  phone: z.string().min(6, 'Valid phone number required'),
});
type SignupForm = z.infer<typeof signupSchema>;

// ── Brand hero ────────────────────────────────────────────

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

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [country, setCountry] = useState<Country | null>(null);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);

  const returnUrl = searchParams.get('returnUrl') ?? '';
  const mobileParam = searchParams.get('mobile') ?? '';

  const { control, register, handleSubmit, getValues, setValue, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: mobileParam },
  });

  const { trigger: sendOtp, isMutating: isSending } = useSWRMutation('/api/auth/send-otp', postJson);
  const { trigger: verifySignup, isMutating: isVerifying } = useSWRMutation('/api/auth/signup/verify', postJson);

  useEffect(() => {
    if (mobileParam) setValue('phone', mobileParam);
  }, [mobileParam, setValue]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const onSendOtp = async (data: SignupForm) => {
    try {
      await sendOtp({ phone: data.phone, type: 'signup' });
      toast.success('OTP sent successfully');
      setStep('otp');
      setTimer(30);
    } catch {
      toast.error('Failed to send OTP. Try again.');
    }
  };

  const handleSignup = useCallback(async (code: string) => {
    if (code.length < 4) return;
    const { phone, firstName, lastName, email } = getValues();
    try {
      await verifySignup({
        phone,
        otp: code,
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        countryCode: country?.callingCode ? Number(country.callingCode) : undefined,
      });
      toast.success('Account created! Welcome to Cadabams.');
      login().catch(() => {});
      router.replace('/home');
    } catch (err: unknown) {
      const e = err as { status?: number; error?: string };
      if (e.error?.includes('already exists')) {
        toast.error('Account already exists');
        router.push('/auth/login');
        return;
      }
      toast.error(e.error ?? 'Signup failed. Try again.');
      setOtp('');
    }
  }, [verifySignup, getValues, country, login, router]);

  useEffect(() => {
    if (otp.length === 4) handleSignup(otp);
  }, [otp, handleSignup]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4f2]">
      {/* Hero */}
      <AuthHero subtitle={step === 'form' ? 'Start your journey.' : 'Verify your number.'} />

      {/* Card — overlaps hero */}
      <div className="flex-1 bg-[#f6f4f2] rounded-t-3xl mt-[-20px] z-10 flex flex-col">
        <div className="px-5 pt-7 pb-6 flex flex-col gap-5 flex-1">

          {step === 'form' ? (
            <>
              <div>
                <h2 className="text-[20px] font-black text-foreground">Create account</h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  A few quick details to get you started
                </p>
              </div>

              <form onSubmit={handleSubmit(onSendOtp)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName" className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                      First Name <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First"
                      className="h-11"
                      {...register('firstName')}
                      aria-invalid={!!errors.firstName}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName" className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Last Name
                    </Label>
                    <Input id="lastName" placeholder="Last" className="h-11" {...register('lastName')} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Email{' '}
                    <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Controller
                  name="phone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Phone <span className="text-primary">*</span>
                      </Label>
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
                  {isSending ? 'Sending…' : 'Continue'}
                </Button>
              </form>

              <p className="text-center text-[13px] text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary font-semibold">
                  Log in
                </Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setOtp(''); }}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground mb-4 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go back
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
                onClick={() => handleSignup(otp)}
                disabled={isVerifying || otp.length < 4}
                className="w-full h-12 rounded-xl font-semibold"
              >
                {isVerifying ? 'Verifying…' : 'Verify & Create Account'}
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

        {/* Footer */}
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
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f6f4f2] flex items-center justify-center">
        <Skeleton className="h-[540px] w-full rounded-3xl" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
