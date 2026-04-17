'use client';

import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/hooks/use-auth';
import { applySafeAreaVars } from '@/lib/capacitor/safe-area';
import { setStatusBarLight } from '@/lib/capacitor/status-bar';
import { setupKeyboardListeners } from '@/lib/capacitor/keyboard';
import { initPushNotifications } from '@/lib/capacitor/push-notifications';
import { setupDeepLinks } from '@/lib/capacitor/deep-links';
import { preventTextZoom } from '@/lib/capacitor/text-zoom';
import { isNative } from '@/lib/capacitor/platform';

/**
 * CapacitorInit — rendered once in app/layout.tsx inside AppProviders.
 * Orchestrates all Capacitor plugin initialisation on app start.
 * Returns null (no UI).
 */
export function CapacitorInit() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // --- Core initialisation (runs once on mount) ---
  useEffect(() => {
    let cleanupKeyboard: (() => void) | undefined;
    let cleanupDeepLinks: (() => void) | undefined;

    (async () => {
      // 1. Apply safe area CSS vars
      await applySafeAreaVars();

      // 2. Status bar — light style (dark text on light background)
      await setStatusBarLight();

      // 3. Prevent iOS accessibility text zoom from breaking layout
      await preventTextZoom();

      // 4. Keyboard listeners — show/hide bottom nav, adjust layout
      cleanupKeyboard = await setupKeyboardListeners();

      // 5. Deep links — handle universal links / app links
      cleanupDeepLinks = await setupDeepLinks(router);

      // 6. On iOS, also set accessory bar visible for keyboard
      const native = await isNative();
      if (native) {
        try {
          const { Keyboard } = await import('@capacitor/keyboard');
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
        } catch { /* ignore — plugin may not support this on all versions */ }
      }
    })();

    return () => {
      cleanupKeyboard?.();
      cleanupDeepLinks?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Push notifications (runs when user logs in) ---
  useEffect(() => {
    if (!user) return;
    initPushNotifications().catch((e) => {
      console.warn('[CapacitorInit] initPushNotifications failed:', e);
    });
  }, [user]);

  return null;
}
