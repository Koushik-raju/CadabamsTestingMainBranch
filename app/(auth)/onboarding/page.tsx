'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Users, CalendarIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/shared/navigation/back-button';
import { crmClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';
import { getMastersRelationships } from '@/sdk/auth-and-crm';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────

type Step = 'service-for' | 'patient-form' | 'date-of-birth' | 'assistance-selection' | 'notification' | 'permissions';

interface Relationship { id: number; name: string; }

interface FormData {
  serviceForSelf: boolean;
  patientFirstName: string;
  patientLastName: string;
  relationship: string;
  dob: string;
  tags: string[];
  notifPhone: boolean;
  notifEmail: boolean;
  notifWhatsapp: boolean;
  locationPermission: boolean;
  bluetoothPermission: boolean;
  trackingPermission: boolean;
}

const TAGS = [
  'Anxiety', 'Depression', 'Stress', 'Relationship Issues', 'Sleep Problems',
  'Trauma & PTSD', 'Grief & Loss', 'Self-esteem', 'Anger Management', "I'm Not Sure",
];

const STEPS: Step[] = ['service-for', 'patient-form', 'date-of-birth', 'assistance-selection', 'notification', 'permissions'];

// ─── Onboarding ───────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const returnUrl = searchParams.get('returnUrl') ?? '';

  const [step, setStep] = useState<Step>('service-for');
  const [loading, setLoading] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [data, setData] = useState<FormData>({
    serviceForSelf: true,
    patientFirstName: '',
    patientLastName: '',
    relationship: '',
    dob: '',
    tags: [],
    notifPhone: true,
    notifEmail: true,
    notifWhatsapp: false,
    locationPermission: false,
    bluetoothPermission: false,
    trackingPermission: false,
  });

  useEffect(() => {
    getMastersRelationships()
      .then((r) => setRelationships(r.data ?? []))
      .catch(() => {});
  }, []);

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const visibleSteps = STEPS.filter((s) => s !== 'patient-form' || !data.serviceForSelf);
  const currentIndex = visibleSteps.indexOf(step);
  const progress = ((currentIndex + 1) / visibleSteps.length) * 100;

  const goBack = () => {
    const prev = visibleSteps[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const goNext = () => {
    const next = visibleSteps[currentIndex + 1];
    if (next) setStep(next);
  };

  const handleDone = async () => {
    setLoading(true);
    try {
      await crmClient.post(endpoints.SEND_SIGN_UP_QUESTIONS, {
        lead_id: user?.lead_id,
        dob: data.dob,
        tags: data.tags.join(','),
        notifPhone: data.notifPhone,
        notifEmail: data.notifEmail,
        notifWhatsapp: data.notifWhatsapp,
        patientFirstName: data.patientFirstName,
        patientLastName: data.patientLastName,
        locationPermission: data.locationPermission,
        bluetoothPermission: data.bluetoothPermission,
        trackingPermission: data.trackingPermission,
      });
    } catch {
      // Non-critical — continue anyway
    } finally {
      setLoading(false);
    }
    router.replace(returnUrl ? decodeURIComponent(returnUrl) : '/home');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-col flex-1 p-6 gap-6">
        {currentIndex > 0 && <BackButton onClick={goBack} />}

        {/* ── service-for ── */}
        {step === 'service-for' && (
          <div className="flex flex-col flex-1 gap-6 justify-center max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-semibold">Who are you seeking services for?</h1>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Yourself', icon: User, self: true },
                { label: 'Someone Else', icon: Users, self: false },
              ].map(({ label, icon: Icon, self }) => (
                <Card
                  key={label}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    set('serviceForSelf', self);
                    setStep(self ? 'date-of-birth' : 'patient-form');
                  }}
                >
                  <CardContent className="flex items-center gap-4 p-5">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="font-medium">{label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── patient-form ── */}
        {step === 'patient-form' && (
          <div className="flex flex-col flex-1 gap-6 justify-center max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-semibold">Patient information</h1>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pFirst">First Name</Label>
                <Input id="pFirst" value={data.patientFirstName} onChange={(e) => set('patientFirstName', e.target.value)} placeholder="First name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pLast">Last Name</Label>
                <Input id="pLast" value={data.patientLastName} onChange={(e) => set('patientLastName', e.target.value)} placeholder="Last name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Relationship</Label>
                <Select value={data.relationship} onValueChange={(v) => set('relationship', v)}>
                  <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  <SelectContent>
                    {relationships.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={goNext} disabled={!data.patientFirstName || !data.relationship} className="w-full">Continue</Button>
          </div>
        )}

        {/* ── date-of-birth ── */}
        {step === 'date-of-birth' && (
          <div className="flex flex-col flex-1 gap-6 justify-center max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-semibold">What is your date of birth?</h1>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dob"
                  type="date"
                  value={data.dob}
                  onChange={(e) => set('dob', e.target.value)}
                  className="pl-9"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <Button onClick={goNext} disabled={!data.dob} className="w-full">Continue</Button>
          </div>
        )}

        {/* ── assistance-selection ── */}
        {step === 'assistance-selection' && (
          <div className="flex flex-col flex-1 gap-6 max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-semibold">What do you need assistance with?</h1>
            <p className="text-muted-foreground text-sm">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => set('tags', data.tags.includes(tag) ? data.tags.filter((t) => t !== tag) : [...data.tags, tag])}
                >
                  <Badge
                    variant={data.tags.includes(tag) ? 'default' : 'outline'}
                    className={cn('cursor-pointer text-sm py-1.5 px-3', data.tags.includes(tag) && 'bg-primary text-primary-foreground')}
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
            <Button onClick={goNext} disabled={data.tags.length === 0} className="w-full mt-auto">Continue</Button>
          </div>
        )}

        {/* ── notification ── */}
        {step === 'notification' && (
          <div className="flex flex-col flex-1 gap-6 justify-center max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-semibold">Stay in the loop</h1>
            <p className="text-muted-foreground text-sm">Choose how you&apos;d like to receive updates</p>
            <div className="flex flex-col gap-5">
              {([
                { key: 'notifPhone', label: 'Phone Notifications' },
                { key: 'notifEmail', label: 'Email Notifications' },
                { key: 'notifWhatsapp', label: 'WhatsApp Updates' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-base">{label}</Label>
                  <Switch id={key} checked={data[key] as boolean} onCheckedChange={() => set(key, !data[key])} />
                </div>
              ))}
            </div>
            <Button onClick={goNext} className="w-full mt-auto">Continue</Button>
          </div>
        )}

        {/* ── permissions ── */}
        {step === 'permissions' && (
          <div className="flex flex-col flex-1 gap-6 justify-center max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-semibold">App permissions</h1>
            <p className="text-muted-foreground text-sm">Help us personalise your experience</p>
            <div className="flex flex-col gap-5">
              {([
                { key: 'locationPermission', label: 'Location Access' },
                { key: 'bluetoothPermission', label: 'Bluetooth' },
                { key: 'trackingPermission', label: 'Allow Tracking' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-base">{label}</Label>
                  <Switch id={key} checked={data[key] as boolean} onCheckedChange={() => set(key, !data[key])} />
                </div>
              ))}
            </div>
            <Button onClick={handleDone} disabled={loading} className="w-full mt-auto">
              {loading ? 'Saving…' : 'Get Started'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return <Suspense><OnboardingContent /></Suspense>;
}
