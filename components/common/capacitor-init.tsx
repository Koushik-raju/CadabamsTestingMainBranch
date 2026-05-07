"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setupDeepLinks } from "@/lib/capacitor/deep-links";
import { setupKeyboardListeners } from "@/lib/capacitor/keyboard";
import { isNative } from "@/lib/capacitor/platform";
import { setStatusBarLight } from "@/lib/capacitor/status-bar";
import { preventTextZoom } from "@/lib/capacitor/text-zoom";

/**
 * CapacitorInit — rendered once in app/layout.tsx inside AppProviders.
 * Orchestrates Capacitor plugin initialisation on app start.
 * Returns null (no UI).
 *
 * Push / local notifications were intentionally removed for this release: they
 * require APNs entitlements + permission prompts that App Store reviewers test,
 * and the FCM/APNs pipeline isn't wired. Re-add when push is fully ready.
 */
export function CapacitorInit() {
  const router = useRouter();

  useEffect(() => {
    let cleanupKeyboard: (() => void) | undefined;
    let cleanupDeepLinks: (() => void) | undefined;

    (async () => {
      /*
       * Run all independent setup steps in parallel — they each call isNative()
       * which resolves @capacitor/core once and caches the result, so the
       * parallel fan-out shares a single dynamic import resolution.
       */
      const [keyboard, deepLinks] = await Promise.all([
        setStatusBarLight(),
        preventTextZoom(),
        setupKeyboardListeners(),
        setupDeepLinks(router),
      ]).then(([, , kb, dl]) => [kb, dl] as const);

      cleanupKeyboard = keyboard;
      cleanupDeepLinks = deepLinks;

      // Keyboard accessory bar — iOS only, runs after the parallel block
      // because it also needs the cached platform result (free at this point)
      if (await isNative()) {
        try {
          const { Keyboard } = await import("@capacitor/keyboard");
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
        } catch {
          /* plugin may not support this on all versions */
        }
      }
    })();

    return () => {
      cleanupKeyboard?.();
      cleanupDeepLinks?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
