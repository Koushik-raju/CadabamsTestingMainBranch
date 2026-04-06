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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, MessageCircle } from 'lucide-react';

// ── Fetcher ───────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [country, setCountry] = useState<Country | null>(null);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);

  const from = searchParams.get('from') ?? '';
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

  // Resend timer countdown
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
      router.replace(from === 'assessment' ? `/service-for?from=${from}&returnUrl=${returnUrl}` : '/home');
    } catch (err: unknown) {
      const e = err as { status?: number; error?: string };
      if (e.error?.includes('already exists')) {
        toast.error('Account already exists');
        router.push('/login');
        return;
      }
      toast.error(e.error ?? 'Signup failed. Try again.');
      setOtp('');
    }
  }, [verifySignup, getValues, country, login, router, from, returnUrl]);

  // Auto-submit when all 4 digits entered
  useEffect(() => {
    if (otp.length === 4) handleSignup(otp);
  }, [otp, handleSignup]);

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

        <div className="p-6 flex flex-col gap-5">
          {step === 'form' ? (
            <form onSubmit={handleSubmit(onSendOtp)} className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Create account</h1>
                <p className="text-sm text-muted-foreground mt-1">Tell us about yourself</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName">
                    First Name <span className="text-primary">*</span>
                  </Label>
                  <Input id="firstName" placeholder="First" {...register('firstName')} aria-invalid={!!errors.firstName} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Last" {...register('lastName')} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">
                  Email <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register('email')} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
                    {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />

              <Button type="submit" disabled={isSending} className="w-full h-11">
                {isSending ? 'Sending…' : 'Continue'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium">Log in</Link>
              </p>
            </form>
          ) : (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setOtp(''); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go back
                </button>
                <h1 className="text-xl font-semibold text-foreground">Verify phone</h1>
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
                onClick={() => handleSignup(otp)}
                disabled={isVerifying || otp.length < 4}
                className="w-full h-11"
              >
                {isVerifying ? 'Verifying…' : 'Verify & Create Account'}
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
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f6f4f2] flex items-center justify-center">
        <Skeleton className="h-[540px] w-80 rounded-2xl" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
