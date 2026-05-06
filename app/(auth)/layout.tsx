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
 *   3. useEffect on mount sets default status bar color (#faf7f4 cream), light icons,
 *      and initializes capacitor-plugin-safe-area so --safe-area-inset-* CSS
 *      vars hold the real iOS notch/home-indicator pixel values (env() reads
 *      0px when StatusBar.overlaysWebView is true).
 *   4. FAB hides on /journeys/* routes.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AuthLayout              — default export wrapping {children}
 *
 * DEPENDENCIES:
 *   useEffect               — react
 *   SWRConfig               — swr
 *   setStatusBarColor, setStatusBarLight — lib/capacitor/status-bar
 *   BookingProvider         — contexts/booking-context
 *   JourneyReturnProvider   — contexts/journey-return-context
 *   JourneyReturnFab        — components/journey/journey-return-fab
 *
 * LAST UPDATED: 2026-05-06 — add padding-top to .auth-layout-wrapper; suppressHydrationWarning on wrapper div for safe-area CSS var mismatch.
 */
"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";
import { JourneyReturnFab } from "@/components/journey/journey-return-fab";
import { BookingProvider } from "@/contexts/booking-context";
import { JourneyReturnProvider } from "@/contexts/journey-return-context";
import { applySafeAreaVars, subscribeSafeAreaChanges } from "@/lib/capacitor/safe-area";
import { setStatusBarColor, setStatusBarLight } from "@/lib/capacitor/status-bar";

const swrConfig = { revalidateOnFocus: false };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    /*
     * Default status bar appearance for all authenticated pages.
     * setStatusBarColor: on Android, sets the native bar background to cream.
     * On iOS (overlaysWebView: true), the WebView extends behind the bar —
     * the page's cream background shows through naturally.
     * setStatusBarLight: ensures clock/battery icons are dark (readable on cream bg).
     */
    setStatusBarColor("#faf7f4");
    setStatusBarLight();

    /*
     * Populate --safe-area-inset-* CSS vars from the native plugin and keep
     * them in sync. The cleanup removes the orientation-change listener on unmount.
     */
    void applySafeAreaVars();
    let cleanupListener: (() => Promise<void>) | undefined;
    void subscribeSafeAreaChanges().then((fn) => {
      cleanupListener = fn;
    });
    return () => {
      void cleanupListener?.();
    };
  }, []);

  return (
    <SWRConfig value={swrConfig}>
      <BookingProvider>
        <JourneyReturnProvider>
          {/* suppressHydrationWarning: safe-area CSS vars are 0px on SSR, populated client-side by the native plugin */}
          <div className="auth-layout-wrapper" suppressHydrationWarning>
            {children}
          </div>
          <JourneyReturnFab />
        </JourneyReturnProvider>
      </BookingProvider>
    </SWRConfig>
  );
}
