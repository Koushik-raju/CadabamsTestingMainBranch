/**
 * FILE: app/(auth)/layout.tsx
 *
 * PURPOSE:
 *   Root layout for every authed route. Wires SWR config, booking
 *   context, journey-return context, and status bar appearance.
 *   Renders a floating CTA above every page when a journey task is in flight.
 *
 * LOGIC OVERVIEW:
 *   1. Wraps children in SWRConfig (no focus revalidation, Capacitor shell quirk).
 *   2. Stacks BookingProvider, JourneyReturnProvider, and mounts <JourneyReturnFab />.
 *   3. FAB hides on /journeys/* routes.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AuthLayout              — default export wrapping {children}
 *
 * DEPENDENCIES:
 *   SWRConfig               — swr
 *   BookingProvider         — contexts/booking-context
 *   JourneyReturnProvider   — contexts/journey-return-context
 *   JourneyReturnFab        — components/journey/journey-return-fab
 *
 * LAST UPDATED: 2026-05-07 — removed safe-area plugin imports; pure CSS env() approach
 */
"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";
import { JourneyReturnFab } from "@/components/journey/journey-return-fab";
import { BookingProvider } from "@/contexts/booking-context";
import { JourneyReturnProvider } from "@/contexts/journey-return-context";

const swrConfig = { revalidateOnFocus: false };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <BookingProvider>
        <JourneyReturnProvider>
          {/* suppressHydrationWarning: safe-area CSS vars are 0px on SSR, populated client-side by the native plugin */}
          <div suppressHydrationWarning>{children}</div>
          <JourneyReturnFab />
        </JourneyReturnProvider>
      </BookingProvider>
    </SWRConfig>
  );
}
