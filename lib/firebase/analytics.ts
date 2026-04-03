'use client';

import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import { app } from './index';

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

export async function getFirebaseAnalytics() {
  if (typeof window === 'undefined') return null;
  if (analyticsInstance) return analyticsInstance;
  const supported = await isSupported();
  if (supported) {
    analyticsInstance = getAnalytics(app);
  }
  return analyticsInstance;
}

export async function logFirebaseEvent(eventName: string, params?: Record<string, unknown>) {
  const analytics = await getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
}
