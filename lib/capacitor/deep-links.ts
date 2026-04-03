/**
 * Deep link handling for Capacitor.
 * Listens for App 'appUrlOpen' events and navigates using Next.js router.
 */
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { isNative } from './platform';

/**
 * Sets up deep link listeners.
 * Returns a cleanup function that removes all listeners.
 *
 * URL mapping:
 *   consult.cadabams.com/payment-success → /booking/success
 *   consult.cadabams.com/payment-failed  → /booking/failed
 *   consult.cadabams.com/callback        → /callback (with search params)
 *   consult.cadabams.com/*               → pass-through path
 */
export async function setupDeepLinks(router: AppRouterInstance): Promise<() => void> {
  if (!(await isNative())) return () => {};

  try {
    const { App } = await import('@capacitor/app');

    const handle = await App.addListener('appUrlOpen', ({ url }) => {
      try {
        const u = new URL(url);

        if (u.host !== 'consult.cadabams.com') return;

        // Normalise the path
        const path = u.pathname.replace(/\/$/, ''); // strip trailing slash

        // Explicit route overrides
        if (path === '/payment-success') {
          router.push('/booking/success');
          return;
        }
        if (path === '/payment-failed') {
          router.push('/booking/failed');
          return;
        }
        if (path === '/callback') {
          router.push(`/callback${u.search}`);
          return;
        }

        // Default: navigate to whatever path the URL contains
        router.push(path + (u.search ?? ''));
      } catch (e) {
        console.warn('[DeepLinks] Failed to handle URL:', url, e);
      }
    });

    return () => {
      handle.remove();
    };
  } catch (e) {
    console.warn('[DeepLinks] setupDeepLinks failed:', e);
    return () => {};
  }
}
