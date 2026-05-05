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
 *   3. useEffect on mount sets default status bar color (#fffdf9 cream) and light icons.
 *   4. FAB hides on /journeys/* routes.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AuthLayout              — default export wrapping {children}
 *   layoutStyle             — inline padding for safe area insets (notch/home button)
 *
 * DEPENDENCIES:
 *   useEffect               — react
 *   SWRConfig               — swr
 *   setStatusBarColor, setStatusBarLight — lib/capacitor/status-bar
 *   BookingProvider         — contexts/booking-context
 *   JourneyReturnProvider   — contexts/journey-return-context
 *   JourneyReturnFab        — components/journey/journey-return-fab
 *
 * LAST UPDATED: 2026-05-05 — add status bar color setup (Phase 3.5 blending)
 */
"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";
import { JourneyReturnFab } from "@/components/journey/journey-return-fab";
import { BookingProvider } from "@/contexts/booking-context";
import { JourneyReturnProvider } from "@/contexts/journey-return-context";
import { setStatusBarColor, setStatusBarLight } from "@/lib/capacitor/status-bar";

const swrConfig = { revalidateOnFocus: false };
const layoutStyle = {
  paddingTop: "var(--safe-area-inset-top)",
  paddingBottom: "var(--safe-area-inset-bottom)",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    /*
     * Default status bar appearance for all authenticated pages.
     * setStatusBarColor: on Android, sets the native bar background to cream.
     * On iOS (overlaysWebView: true), the WebView extends behind the bar —
     * the page's cream background shows through naturally.
     * setStatusBarLight: ensures clock/battery icons are dark (readable on cream bg).
     */
    setStatusBarColor("#fffdf9");
    setStatusBarLight();
  }, []);

  return (
    <SWRConfig value={swrConfig}>
      <BookingProvider>
        <JourneyReturnProvider>
          <div style={layoutStyle}>{children}</div>
          <JourneyReturnFab />
        </JourneyReturnProvider>
      </BookingProvider>
    </SWRConfig>
  );
}
