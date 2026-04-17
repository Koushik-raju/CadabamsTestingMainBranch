'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { logFirebaseEvent } from '@/lib/firebase/analytics';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function pushGtag(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

export function AnalyticsInitializer() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    try {
      pushGtag('page_view', { page_path: pathname });
      void logFirebaseEvent('page_view', { page_path: pathname });
    } catch {
      // analytics must never crash the app
    }
  }, [pathname]);

  useEffect(() => {
    if (user?.lead_id) {
      try {
        pushGtag('set', { user_id: String(user.lead_id), name: user.name, email: user.email });
        void logFirebaseEvent('identify', { user_id: String(user.lead_id) });
      } catch {
        // analytics must never crash the app
      }
    }
  }, [user]);

  return null;
}
