/**
 * FILE: lib/capacitor/push-notifications.ts
 *
 * PURPOSE:
 *   Initialises Capacitor push notifications on native platforms: requests
 *   permission, registers with APNs/FCM, and handles foreground/tap events.
 *
 * LOGIC OVERVIEW:
 *   1. Guards against non-native environments via isNative().
 *   2. Requests OS push permission; exits early if denied.
 *   3. Registers the device for remote notifications.
 *   4. Adds listeners for foreground notifications and notification taps.
 *   5. On tap, resolves a client-side route from the notification payload
 *      and navigates via window.location.href.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   initPushNotifications — call once after auth; sets up all listeners
 *
 * DEPENDENCIES:
 *   @capacitor/push-notifications — native push bridge
 *   lib/capacitor/platform        — isNative() guard
 *
 * LAST UPDATED: 2026-04-17 — removed Firebase RTDB token saving (Firebase removed)
 */
import { isNative } from './platform';

/**
 * Full push notification initialisation:
 *  1. Request permission
 *  2. Register for remote notifications
 *  3. Handle foreground notifications
 *  4. Handle notification taps (navigate to relevant page)
 */
export async function initPushNotifications(): Promise<void> {
  if (!(await isNative())) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // 1. Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('[PushNotifications] Permission not granted:', permResult.receive);
      return;
    }

    // 2. Register with APNs/FCM
    await PushNotifications.register();

    // Handle registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[PushNotifications] Registration error:', error);
    });

    // 3. Handle foreground notifications
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushNotifications] Foreground notification received:', notification.title);
    });

    // 4. Handle notification taps — navigate to the appropriate page
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data as Record<string, unknown> | undefined;
      if (!data) return;

      const route = resolveNotificationRoute(data);
      if (route && typeof window !== 'undefined') {
        window.location.href = route;
      }
    });
  } catch (e) {
    console.warn('[PushNotifications] initPushNotifications failed:', e);
  }
}

function resolveNotificationRoute(data: Record<string, unknown>): string | null {
  const type = data['type'] as string | undefined;
  const id = data['id'] as string | undefined;

  switch (type) {
    case 'appointment':
      return id ? `/appointments/${id}` : '/appointments';
    case 'chat':
      return id ? `/chat/${id}` : '/chat';
    case 'payment_success':
      return '/booking/success';
    case 'payment_failed':
      return '/booking/failed';
    case 'session':
      return '/sessions';
    default:
      if (data['url'] && typeof data['url'] === 'string') {
        try {
          const u = new URL(data['url']);
          if (u.host === 'consult.cadabams.com') {
            return u.pathname + (u.search ?? '');
          }
        } catch {
          // ignore malformed URL
        }
      }
      return null;
  }
}
