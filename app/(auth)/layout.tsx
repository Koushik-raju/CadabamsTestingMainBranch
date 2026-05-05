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
 *   layoutStyle             — inline padding for the bottom home-indicator inset only
 *
 * DEPENDENCIES:
 *   useEffect               — react
 *   SWRConfig               — swr
 *   setStatusBarColor, setStatusBarLight — lib/capacitor/status-bar
 *   BookingProvider         — contexts/booking-context
 *   JourneyReturnProvider   — contexts/journey-return-context
 *   JourneyReturnFab        — components/journey/journey-return-fab
 *
 * LAST UPDATED: 2026-05-05 — drop layout-level paddingTop. With
 *   StatusBar.overlaysWebView=false iOS reserves the bar space natively, so
 *   the WebView starts below the bar and an extra paddingTop just adds a
 *   visible gap. Bottom home-indicator inset stays. The safe-area plugin is
 *   still initialized in case any page wants to read --safe-area-inset-top
 *   directly (e.g. for inline styles).
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
const layoutStyle = {
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
    setStatusBarColor("#faf7f4");
    setStatusBarLight();

    /*
     * Populate --safe-area-inset-* CSS vars from the native plugin and keep
     * them in sync. Must run before paint to avoid a frame where layoutStyle's
     * paddingTop reads 0px and content flashes under the notch — the await in
     * applySafeAreaVars is unavoidable but Capacitor's plugin call is fast.
     * The cleanup removes the orientation-change listener on unmount.
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
          <div style={layoutStyle}>{children}</div>
          <JourneyReturnFab />
        </JourneyReturnProvider>
      </BookingProvider>
    </SWRConfig>
  );
}
