/**
 * Push notification flow for Capacitor + Firebase.
 * All imports are dynamic to avoid SSR crashes.
 */
import { isNative } from './platform';

/**
 * Saves an FCM token to Firebase RTDB at users/{userId}/fcmToken.
 */
export async function updateFcmToken(userId: string, token: string): Promise<void> {
  try {
    const { getDatabase, ref, set } = await import('firebase/database');
    const { app } = await import('@/lib/firebase');
    const db = getDatabase(app);
    await set(ref(db, `users/${userId}/fcmToken`), token);
  } catch (e) {
    console.warn('[PushNotifications] updateFcmToken failed:', e);
  }
}

/**
 * Full push notification initialisation:
 *  1. Request permission
 *  2. Register for remote notifications (FCM)
 *  3. Save FCM token to Firebase RTDB
 *  4. Handle foreground notifications
 *  5. Handle notification taps (navigate to relevant page)
 */
export async function initPushNotifications(userId: string): Promise<void> {
  if (!(await isNative())) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // 1. Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('[PushNotifications] Permission not granted:', permResult.receive);
      return;
    }

    // 2. Register with FCM
    await PushNotifications.register();

    // 3. Save FCM token when registration completes
    await PushNotifications.addListener('registration', async (token) => {
      await updateFcmToken(userId, token.value);
    });

    // Handle registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[PushNotifications] Registration error:', error);
    });

    // 4. Handle foreground notifications (display a toast or local notification)
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushNotifications] Foreground notification received:', notification.title);
      // Foreground notifications are handled by the app; the OS won't display them
      // Components that need to react can subscribe to their own SWR keys
    });

    // 5. Handle notification taps — navigate to the appropriate page
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

/**
 * Resolves a client-side route from notification payload data.
 */
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
