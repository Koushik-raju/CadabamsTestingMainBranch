/**
 * FILE: components/common/android-safe-area-bars.tsx
 *
 * PURPOSE:
 *   Renders fixed top/bottom bars that paint bg-background over the Android
 *   safe area insets (status bar + navigation bar). Only mounted on Android —
 *   iOS handles this differently via the status bar overlay, and web does not
 *   need it.
 *
 * LOGIC OVERVIEW:
 *   - On mount, calls isAndroid() (async, cached after first resolution).
 *   - Sets isAndroid state; renders null until resolved.
 *   - On Android: two fixed divs fill the top/bottom safe-area inset heights.
 *   - On iOS/web: returns null.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AndroidSafeAreaBars — default export, no props
 *
 * DEPENDENCIES:
 *   @/lib/capacitor/platform (isAndroid)
 *
 * LAST UPDATED: 2026-05-07 — initial creation, extracted from app/layout.tsx
 */

"use client";

import { useEffect, useState } from "react";
import { isAndroid } from "@/lib/capacitor/platform";

export function AndroidSafeAreaBars() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    isAndroid().then(setShow);
  }, []);

  if (!show) return null;

  return (
    <>
      <div className="fixed top-0 inset-x-0 h-[var(--safe-area-inset-top)] bg-background z-100" />
      <div className="fixed bottom-0 inset-x-0 h-[var(--safe-area-inset-bottom)] bg-background z-100" />
    </>
  );
}
