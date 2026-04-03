/**
 * Platform detection utilities for Capacitor.
 * All imports are dynamic to avoid SSR crashes.
 */

export async function isNative(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function isIOS(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.getPlatform() === 'ios';
  } catch {
    return false;
  }
}

export async function isAndroid(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

/**
 * Synchronous native check — reads window.Capacitor if available.
 * Safe to call during render (no async required).
 */
export function isNativeSync(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (window as unknown as Record<string, unknown>)['Capacitor'] as
      | { isNativePlatform?: () => boolean }
      | undefined;
    return typeof cap?.isNativePlatform === 'function'
      ? cap.isNativePlatform()
      : false;
  } catch {
    return false;
  }
}
