'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SWRConfig } from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingProvider } from '@/contexts/booking-context';
import { hasAccessToken, setRedirectPath } from '@/lib/cookies';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      const authenticated = await hasAccessToken();
      if (!authenticated) {
        const path = window.location.pathname + window.location.search;
        setRedirectPath(path);
        router.replace('/auth/login');
      } else {
        setReady(true);
      }
    }
    check();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
    );
  }

  return (
    <SWRConfig value={{ revalidateOnFocus: false }}>
      <BookingProvider>
        <div style={{ paddingTop: 'var(--safe-area-inset-top)', paddingBottom: 'var(--safe-area-inset-bottom)' }}>
          {children}
        </div>
      </BookingProvider>
    </SWRConfig>
  );
}
