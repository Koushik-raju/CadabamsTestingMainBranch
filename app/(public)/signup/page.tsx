'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { PhoneInput, type Country } from '@/components/common/phone-input';
import { OTPInput } from '@/components/common/otp-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const uidRef = useRef(uuidv4());

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otp, setOtp] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: null as Country | null,
  });

  const from = searchParams.get('from') ?? '';
  const returnUrl = searchParams.get('returnUrl') ?? '';
  const mobileParam = searchParams.get('mobile') ?? '';

  useEffect(() => {
    if (mobileParam) setForm((f) => ({ ...f, phone: mobileParam }));
  }, [mobileParam]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (!form.firstName.trim()) { toast.error('First name is required'); return false; }
    if (!form.phone || form.phone.length < 6) { toast.error('Valid phone number required'); return false; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Invalid email'); return false; }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.sendOtpAndCheckUserExist(
        form.phone, 'signup', uidRef.current, form.country?.callingCode ?? '91'
      );
      setStep('otp');
      setTimer(30);
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = useCallback(async (code: string) => {
    if (code.length < 4) return;
    setLoading(true);
    try {
      const res = await authService.createUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phone,
        otp: code,
        uid: uidRef.current,
        countryCode: form.country?.callingCode ?? '91',
      });
      if (res.success && res.data) {
        Cookies.set('auth-token', String(res.data.lead_id), { expires: 30 });
        await login(res.data as Parameters<typeof login>[0]);
        const dest = from === 'assessment' ? `/service-for?from=${from}&returnUrl=${returnUrl}` : '/service-for';
        router.replace(dest);
      } else {
        toast.error(res.message ?? 'Signup failed');
        if (res.message?.includes('already exists')) router.push('/login');
      }
    } catch {
      toast.error('Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  }, [form, login, router, from, returnUrl]);

  useEffect(() => {
    if (otp.length === 4) handleSignup(otp);
  }, [otp, handleSignup]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>
            {step === 'form' ? 'Tell us about yourself' : 'Enter the OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {step === 'form' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={form.firstName} onChange={field('firstName')} placeholder="First" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={form.lastName} onChange={field('lastName')} placeholder="Last" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" value={form.email} onChange={field('email')} placeholder="you@example.com" />
              </div>
              <PhoneInput value={form.phone} onChange={field('phone')} selectedCountry={form.country} onCountryChange={(c) => setForm((f) => ({ ...f, country: c }))} />
              <Button onClick={handleSendOtp} disabled={loading} className="w-full">
                {loading ? 'Sending…' : 'Continue'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium">Log in</Link>
              </p>
            </>
          ) : (
            <>
              <OTPInput value={otp} onChange={setOtp} />
              {loading && <Skeleton className="h-5 w-40 mx-auto" />}
              <div className="flex items-center justify-between text-sm">
                <button onClick={() => { setStep('form'); setOtp(''); }} className="text-muted-foreground">Go back</button>
                {timer > 0
                  ? <span className="text-muted-foreground">Resend in {timer}s</span>
                  : <button onClick={handleSendOtp} className="text-primary font-medium">Resend OTP</button>}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Skeleton className="h-96 w-80" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
