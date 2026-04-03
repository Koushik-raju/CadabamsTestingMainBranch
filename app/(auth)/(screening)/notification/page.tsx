'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/common/back-button';

function NotificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = useState({ phone: true, email: true, whatsapp: false });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleContinue = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('notifPhone', String(prefs.phone));
    params.set('notifEmail', String(prefs.email));
    params.set('notifWhatsapp', String(prefs.whatsapp));
    router.push(`/permissions?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <BackButton />
      <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-semibold">Stay in the loop</h1>
        <p className="text-muted-foreground text-sm">Choose how you'd like to receive updates</p>
        <div className="flex flex-col gap-5">
          {([
            { key: 'phone', label: 'Phone Notifications' },
            { key: 'email', label: 'Email Notifications' },
            { key: 'whatsapp', label: 'WhatsApp Updates' },
          ] as const).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="text-base">{label}</Label>
              <Switch id={key} checked={prefs[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleContinue} className="w-full max-w-sm mx-auto">Continue</Button>
    </div>
  );
}

export default function NotificationPage() {
  return <Suspense><NotificationContent /></Suspense>;
}
