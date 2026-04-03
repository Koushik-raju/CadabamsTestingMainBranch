'use client';

import { useEffect } from 'react';

export function CapacitorInit() {
  useEffect(() => {
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!['ios', 'android'].includes(Capacitor.getPlatform())) return;

        await new Promise((r) => setTimeout(r, 100));

        try {
          const { Keyboard } = await import('@capacitor/keyboard');
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
        } catch { /* ignore */ }

        try {
          const { TextZoom } = await import('@capacitor/text-zoom');
          await TextZoom.set({ value: 1.0 });
        } catch { /* ignore */ }

        try {
          const { SafeArea } = await import('capacitor-plugin-safe-area');
          const { insets } = await SafeArea.getSafeAreaInsets();
          const root = document.documentElement;
          root.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
          root.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
          root.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
          root.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
        } catch { /* ignore */ }

        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          if (Capacitor.getPlatform() === 'ios') {
            await StatusBar.setOverlaysWebView({ overlay: true });
            await StatusBar.setStyle({ style: Style.Default });
          } else {
            await StatusBar.setOverlaysWebView({ overlay: false });
            await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
            await StatusBar.setStyle({ style: Style.Default });
          }
        } catch { /* ignore */ }

        // Deep link handler
        try {
          const { App } = await import('@capacitor/app');
          App.addListener('appUrlOpen', ({ url }) => {
            try {
              const u = new URL(url);
              if (u.host === 'consult.cadabams.com') {
                window.history.pushState({}, '', u.pathname + (u.search || ''));
              }
            } catch { /* ignore */ }
          });
        } catch { /* ignore */ }
      } catch { /* ignore */ }
    })();
  }, []);

  return null;
}
