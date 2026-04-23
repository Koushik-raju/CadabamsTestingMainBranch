"use client";

import { AuthContext } from "@/hooks/use-auth";
import { setupDeepLinks } from "@/lib/capacitor/deep-links";
import { setupKeyboardListeners } from "@/lib/capacitor/keyboard";
import { isNative } from "@/lib/capacitor/platform";
import { initPushNotifications } from "@/lib/capacitor/push-notifications";
import { applySafeAreaVars } from "@/lib/capacitor/safe-area";
import { setStatusBarLight } from "@/lib/capacitor/status-bar";
import { preventTextZoom } from "@/lib/capacitor/text-zoom";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef } from "react";

/**
 * CapacitorInit — rendered once in app/layout.tsx inside AppProviders.
 * Orchestrates all Capacitor plugin initialisation on app start.
 * Returns null (no UI).
 */
export function CapacitorInit() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  /*
   * Guard so initPushNotifications runs exactly once per session.
   * Without this, any SWR refetch that creates a new user object reference
   * would retrigger the effect and re-request permissions + re-register listeners.
   */
  const pushInitialized = useRef(false);

  // --- Core initialisation (runs once on mount) ---
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
        applySafeAreaVars(),
        setStatusBarLight(),
        preventTextZoom(),
        setupKeyboardListeners(),
        setupDeepLinks(router),
      ]).then(([, , , kb, dl]) => [kb, dl] as const);

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

  // --- Push notifications (runs once, when the user first logs in) ---
  useEffect(() => {
    if (!user || pushInitialized.current) return;
    pushInitialized.current = true;
    initPushNotifications().catch((e) => {
      console.warn("[CapacitorInit] initPushNotifications failed:", e);
    });
  }, [user]);

  return null;
}
