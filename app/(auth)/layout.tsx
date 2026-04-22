/**
 * FILE: app/(auth)/layout.tsx
 *
 * PURPOSE:
 *   Root layout for every authed route. Wires SWR config, booking
 *   context, and the journey-return context so a floating CTA can be
 *   rendered above every page when a journey task is in flight.
 *
 * LOGIC OVERVIEW:
 *   Wraps children in SWRConfig (no focus revalidation, Capacitor shell
 *   quirk), then BookingProvider, then JourneyReturnProvider. Mounts
 *   <JourneyReturnFab /> as a sibling of {children} so the affordance
 *   floats above every screen; the FAB itself hides on /journeys/*
 *   routes.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AuthLayout — default export wrapping {children}
 *
 * DEPENDENCIES:
 *   SWRConfig — swr
 *   BookingProvider — contexts/booking-context
 *   JourneyReturnProvider — contexts/journey-return-context
 *   JourneyReturnFab — components/journey/journey-return-fab
 *
 * LAST UPDATED: 2026-04-22 — add JourneyReturnProvider + global FAB mount.
 */
'use client';

import { SWRConfig } from 'swr';
import { BookingProvider } from '@/contexts/booking-context';
import { JourneyReturnProvider } from '@/contexts/journey-return-context';
import { JourneyReturnFab } from '@/components/journey/journey-return-fab';

const swrConfig = { revalidateOnFocus: false };
const layoutStyle = { paddingTop: 'var(--safe-area-inset-top)', paddingBottom: 'var(--safe-area-inset-bottom)' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <BookingProvider>
        <JourneyReturnProvider>
          <div style={layoutStyle}>
            {children}
          </div>
          <JourneyReturnFab />
        </JourneyReturnProvider>
      </BookingProvider>
    </SWRConfig>
  );
}
