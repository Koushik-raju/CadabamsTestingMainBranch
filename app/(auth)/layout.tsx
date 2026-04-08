'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingProvider } from '@/contexts/booking-context';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hasToken = document.cookie.includes('access_token=') || document.cookie.includes('refresh_token=');
    if (!hasToken) {
      const path = window.location.pathname + window.location.search;
      localStorage.setItem('redirectPath', path);
      router.replace('/login');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
    );
  }

  return (
    <BookingProvider>
      <div style={{ paddingTop: 'var(--safe-area-inset-top)', paddingBottom: 'var(--safe-area-inset-bottom)' }}>
        {children}
      </div>
    </BookingProvider>
  );
}
