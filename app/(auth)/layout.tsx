'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      const path = window.location.pathname + window.location.search;
      localStorage.setItem('redirectPath', path);
      router.replace('/login');
    } else {
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
    <div style={{ paddingTop: 'var(--safe-area-inset-top)', paddingBottom: 'var(--safe-area-inset-bottom)' }}>
      {children}
    </div>
  );
}
