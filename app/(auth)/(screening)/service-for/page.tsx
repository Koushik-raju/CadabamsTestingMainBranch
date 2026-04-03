'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BackButton } from '@/components/common/back-button';

function ServiceForContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = searchParams.toString();
  const suffix = params ? `?${params}` : '';

  const choose = (self: boolean) => {
    if (self) router.push(`/date-of-birth${suffix}`);
    else router.push(`/patient-form${suffix}`);
  };

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <BackButton fallback="/home" />
      <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-semibold">Who are you seeking services for?</h1>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Yourself', icon: User, self: true },
            { label: 'Someone Else', icon: Users, self: false },
          ].map(({ label, icon: Icon, self }) => (
            <Card key={label} className="cursor-pointer hover:border-primary transition-colors" onClick={() => choose(self)}>
              <CardContent className="flex items-center gap-4 p-5">
                <Icon className="h-6 w-6 text-primary" />
                <span className="font-medium">{label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ServiceForPage() {
  return <Suspense><ServiceForContent /></Suspense>;
}
