/**
 * Platform detection utilities for Capacitor.
 * All imports are dynamic to avoid SSR crashes.
 *
 * The platform never changes mid-session, so we resolve @capacitor/core once
 * and cache both the native flag and the platform string. Every subsequent
 * call to isNative / isIOS / isAndroid returns the cached value synchronously
 * inside the promise, skipping repeated dynamic imports.
 */

/* Module-level cache — populated on the first isNative/isIOS/isAndroid call */
let _platform: string | null = null;
let _resolvePromise: Promise<string> | null = null;

async function getPlatform(): Promise<string> {
  if (_platform !== null) return _platform;
  if (_resolvePromise) return _resolvePromise;

  if (typeof window === "undefined") return (_platform = "web");

  _resolvePromise = import("@capacitor/core")
    .then(({ Capacitor }) => {
      _platform = Capacitor.getPlatform(); // "ios" | "android" | "web"
      return _platform;
    })
    .catch(() => {
      _platform = "web";
      return _platform;
    });

  return _resolvePromise;
}

export async function isNative(): Promise<boolean> {
  const p = await getPlatform();
  return p === "ios" || p === "android";
}

export async function isIOS(): Promise<boolean> {
  return (await getPlatform()) === "ios";
}

export async function isAndroid(): Promise<boolean> {
  return (await getPlatform()) === "android";
}

/**
 * Synchronous native check — reads window.Capacitor if available.
 * Safe to call during render without awaiting.
 * Prefer isNative() for accuracy after first async resolution.
 */
export function isNativeSync(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (window as unknown as Record<string, unknown>)["Capacitor"] as
      | { isNativePlatform?: () => boolean }
      | undefined;
    return typeof cap?.isNativePlatform === "function" ? cap.isNativePlatform() : false;
  } catch {
    return false;
  }
}
