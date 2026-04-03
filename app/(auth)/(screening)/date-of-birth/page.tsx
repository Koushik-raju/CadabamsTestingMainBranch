'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/common/back-button';

function DOBContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dob, setDob] = useState('');

  const handleContinue = () => {
    if (!dob) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('dob', dob);
    router.push(`/assistance-selection?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <BackButton />
      <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-semibold">What is your date of birth?</h1>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="pl-9" max={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
        <Button onClick={handleContinue} disabled={!dob} className="w-full">Continue</Button>
      </div>
    </div>
  );
}

export default function DOBPage() {
  return <Suspense><DOBContent /></Suspense>;
}
