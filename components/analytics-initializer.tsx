'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { analyticsService } from '@/services/analytics.service';

export function AnalyticsInitializer() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    analyticsService.trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    if (user?.lead_id) {
      analyticsService.identifyUser(String(user.lead_id), {
        name: user.name as string | undefined,
        email: user.email as string | undefined,
      });
    }
  }, [user]);

  return null;
}
