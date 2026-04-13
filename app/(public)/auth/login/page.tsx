'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import useSWRMutation from 'swr/mutation';
import { ArrowLeft, Heart } from 'lucide-react';
import { PhoneInput, type Country } from '@/components/common/phone-input';
import { OTPInput } from '@/components/common/otp-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

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

const phoneSchema = z.object({
  phone: z.string().min(6, 'Enter a valid phone number'),
});
type PhoneForm = z.infer<typeof phoneSchema>;

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
    <div className="min-h-screen flex flex-col bg-background">

      {/* Gradient hero */}
      <div className="home-header-gradient px-6 pt-14 pb-12 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <Heart className="size-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="text-xs font-bold text-primary-foreground/80 tracking-widest uppercase">
            Cadabams
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary-foreground leading-tight">
            {step === 'phone' ? 'Welcome back.' : 'Verify your number.'}
          </h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            Mental health care, simplified.
          </p>
        </div>
      </div>

      {/* Card — overlaps hero */}
      <div className="flex-1 flex flex-col px-4 mt-[-16px] pb-8">
        <Card className="w-full max-w-sm mx-auto">

          {/* Step progress */}
          <div className="flex gap-1 px-4 pt-4">
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div className={cn('h-1 flex-1 rounded-full transition-colors duration-300', step === 'otp' ? 'bg-primary' : 'bg-border')} />
          </div>

          {step === 'phone' ? (
            <>
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
                <CardDescription>Enter your registered phone number</CardDescription>
              </CardHeader>

              <CardContent>
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
                  <Button type="submit" size="lg" disabled={isSending} className="w-full">
                    {isSending ? 'Sending…' : 'Send OTP'}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex-col gap-3 text-sm">
                <p className="text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Button variant="link" asChild className="p-0 h-auto text-sm">
                    <Link href={`/auth/signup${returnUrl ? `?returnUrl=${returnUrl}` : ''}`}>
                      Sign up
                    </Link>
                  </Button>
                </p>
                <Separator />
                <div className="flex gap-4">
                  <Button variant="link" asChild className="p-0 h-auto text-xs text-muted-foreground">
                    <Link href="/privacy-policy">Privacy Policy</Link>
                  </Button>
                  <Button variant="link" asChild className="p-0 h-auto text-xs text-muted-foreground">
                    <Link href="/term-and-condition">Terms &amp; Conditions</Link>
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-1 mb-1 w-fit text-muted-foreground"
                  onClick={() => { setStep('phone'); setOtp(''); }}
                >
                  <ArrowLeft className="size-4" />
                  Change number
                </Button>
                <CardTitle>Enter the code</CardTitle>
                <CardDescription>
                  Sent to{' '}
                  <span className="font-medium text-foreground">
                    +{country?.callingCode ?? '91'} {getValues('phone')}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <OTPInput value={otp} onChange={setOtp} />
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() => handleVerifyOtp(otp)}
                  disabled={isVerifying || otp.length < 4}
                >
                  {isVerifying ? 'Verifying…' : 'Verify & Sign In'}
                </Button>
              </CardContent>

              <CardFooter className="justify-center">
                {timer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend in <span className="tabular-nums font-medium text-foreground">{timer}s</span>
                  </p>
                ) : (
                  <Button variant="link" className="p-0 h-auto text-sm" onClick={handleSubmit(onSendOtp)}>
                    Resend OTP
                  </Button>
                )}
              </CardFooter>
            </>
          )}
        </Card>
      </div>

      {/* Redirect modal */}
      <Dialog open={redirectModal} onOpenChange={setRedirectModal}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Account not found</DialogTitle>
          <DialogDescription>
            We couldn&apos;t find an account with this number. Would you like to sign up?
          </DialogDescription>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setRedirectModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => router.push(`/auth/signup?mobile=${getValues('phone')}`)}>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-80 w-80 rounded-xl" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
