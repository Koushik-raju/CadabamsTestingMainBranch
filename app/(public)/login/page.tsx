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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [timer, setTimer] = useState(0);
  const [redirectModal, setRedirectModal] = useState(false);
  const uidRef = useRef(uuidv4());

  const returnUrl = searchParams.get('returnUrl') ?? '';
  const from = searchParams.get('from') ?? '';

  const buildRedirect = useCallback(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('redirectPath') : null;
    if (saved) { localStorage.removeItem('redirectPath'); return saved; }
    if (returnUrl) return decodeURIComponent(returnUrl);
    if (from) return decodeURIComponent(from);
    return '/home';
  }, [returnUrl, from]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 6) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      const res = await authService.sendOtpAndCheckUserExist(
        phone, 'login', uidRef.current, country?.callingCode ?? '91'
      );
      if (res.success === false) {
        setRedirectModal(true);
      } else {
        setStep('otp');
        setTimer(30);
      }
    } catch {
      toast.error('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(async (code: string) => {
    if (code.length < 4) return;
    setLoading(true);
    try {
      const res = await authService.verifyOtp(phone, code, uidRef.current);
      const result = res.result ?? res;
      if (result.success || result.data) {
        const user = result.data ?? result;
        Cookies.set('auth-token', user.lead_id ?? user.id ?? uidRef.current, { expires: 30 });
        await login(user);
        router.replace(buildRedirect());
      } else {
        toast.error('Invalid OTP. Try again.');
        setOtp('');
      }
    } catch {
      toast.error('OTP verification failed.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }, [phone, login, router, buildRedirect]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 4) handleVerifyOtp(otp);
  }, [otp, handleVerifyOtp]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            {step === 'phone' ? 'Enter your phone number to continue' : 'Enter the OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {step === 'phone' ? (
            <>
              <PhoneInput value={phone} onChange={(e) => setPhone(e.target.value)} selectedCountry={country} onCountryChange={setCountry} />
              <Button onClick={handleSendOtp} disabled={loading} className="w-full">
                {loading ? 'Sending…' : 'Send OTP'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href={`/signup${returnUrl ? `?returnUrl=${returnUrl}` : ''}`} className="text-primary font-medium">Sign up</Link>
              </p>
            </>
          ) : (
            <>
              <OTPInput value={otp} onChange={setOtp} />
              {loading && <Skeleton className="h-5 w-40 mx-auto" />}
              <div className="flex items-center justify-between text-sm">
                <button onClick={() => { setStep('phone'); setOtp(''); }} className="text-muted-foreground">
                  Change number
                </button>
                {timer > 0 ? (
                  <span className="text-muted-foreground">Resend in {timer}s</span>
                ) : (
                  <button onClick={handleSendOtp} className="text-primary font-medium">Resend OTP</button>
                )}
              </div>
            </>
          )}
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link href="/term-and-condition" className="hover:underline">Terms & Conditions</Link>
          </div>
        </CardContent>
      </Card>

      {/* Redirect modal for non-existing accounts */}
      <Dialog open={redirectModal} onOpenChange={setRedirectModal}>
        <DialogContent>
          <DialogTitle>Account not found</DialogTitle>
          <DialogDescription>We couldn&apos;t find an account with this number. Would you like to sign up?</DialogDescription>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setRedirectModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => router.push(`/signup?mobile=${phone}`)} className="flex-1">Sign Up</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Skeleton className="h-96 w-80" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
