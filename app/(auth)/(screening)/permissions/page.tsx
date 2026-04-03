'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/common/back-button';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';

function PermissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [perms, setPerms] = useState({ location: false, bluetooth: false, tracking: false });
  const [loading, setLoading] = useState(false);

  const toggle = (key: keyof typeof perms) => setPerms((p) => ({ ...p, [key]: !p[key] }));

  const handleDone = async () => {
    setLoading(true);
    try {
      const dob = searchParams.get('dob') ?? '';
      const tags = searchParams.get('tags') ?? '';
      const notifPhone = searchParams.get('notifPhone') === 'true';
      const notifEmail = searchParams.get('notifEmail') === 'true';
      const notifWhatsapp = searchParams.get('notifWhatsapp') === 'true';
      const patientFirstName = searchParams.get('patientFirstName') ?? '';
      const patientLastName = searchParams.get('patientLastName') ?? '';

      await authService.sendSignupQuestions({
        lead_id: user?.lead_id,
        dob, tags, notifPhone, notifEmail, notifWhatsapp,
        patientFirstName, patientLastName,
        locationPermission: perms.location,
        bluetoothPermission: perms.bluetooth,
        trackingPermission: perms.tracking,
      });
    } catch {
      // Non-critical — continue anyway
    } finally {
      setLoading(false);
    }

    const returnUrl = searchParams.get('returnUrl');
    router.replace(returnUrl ? decodeURIComponent(returnUrl) : '/home');
  };

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <BackButton />
      <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-semibold">App permissions</h1>
        <p className="text-muted-foreground text-sm">Help us personalise your experience</p>
        <div className="flex flex-col gap-5">
          {([
            { key: 'location', label: 'Location Access' },
            { key: 'bluetooth', label: 'Bluetooth' },
            { key: 'tracking', label: 'Allow Tracking' },
          ] as const).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="text-base">{label}</Label>
              <Switch id={key} checked={perms[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleDone} disabled={loading} className="w-full max-w-sm mx-auto">
        {loading ? 'Saving…' : 'Get Started'}
      </Button>
    </div>
  );
}

export default function PermissionsPage() {
  return <Suspense><PermissionsContent /></Suspense>;
}
