/**
 * Safe area inset utilities.
 * Reads SafeArea plugin on native; falls back to CSS env() on web.
 *
 * Why the plugin over env(): on iOS Capacitor with StatusBar.overlaysWebView=true
 * (the canonical setup for full-bleed UIs), the WebView extends behind the
 * status bar and CSS env(safe-area-inset-top) reports 0px because the
 * viewport reaches the screen top. capacitor-plugin-safe-area asks UIKit
 * directly for the real notch inset, which is what we need to apply as
 * padding-top on the layout. Pattern is taken from the plugin README
 * (alwaysloveme/capacitor-plugin-safe-area).
 */
import { isNative } from "./platform";

const cssKey = (k: string) => `--safe-area-inset-${k}`;

function writeInsetsToRoot(insets: Record<string, number>): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(insets)) {
    root.style.setProperty(cssKey(key), `${value}px`);
  }
}

/**
 * Reads safe area insets once and writes them as CSS custom properties on :root.
 * On native: uses capacitor-plugin-safe-area for exact pixel values.
 * On web: falls back to env() CSS variables (handled in globals.css).
 */
export async function applySafeAreaVars(): Promise<void> {
  if (typeof document === "undefined") return;

  const native = await isNative();
  if (!native) {
    // On web the CSS vars are already set in globals.css using env() — nothing to do.
    return;
  }

  try {
    const { SafeArea } = await import("capacitor-plugin-safe-area");
    const { insets } = await SafeArea.getSafeAreaInsets();
    writeInsetsToRoot(insets as unknown as Record<string, number>);
  } catch (e) {
    console.warn("[SafeArea] applySafeAreaVars failed — falling back to env():", e);
    // If the plugin fails, reset to env() values
    const root = document.documentElement;
    root.style.setProperty(cssKey("top"), "env(safe-area-inset-top, 0px)");
    root.style.setProperty(cssKey("bottom"), "env(safe-area-inset-bottom, 0px)");
    root.style.setProperty(cssKey("left"), "env(safe-area-inset-left, 0px)");
    root.style.setProperty(cssKey("right"), "env(safe-area-inset-right, 0px)");
  }
}

/**
 * Subscribes to safeAreaChanged events (fired on orientation changes,
 * keyboard show/hide on some devices). Returns an async cleanup function
 * that removes the listener — the caller must invoke it on unmount, since
 * Capacitor's PluginListenerHandle.remove is async.
 */
export async function subscribeSafeAreaChanges(): Promise<() => Promise<void>> {
  if (typeof document === "undefined") return async () => {};

  const native = await isNative();
  if (!native) return async () => {};

  try {
    const { SafeArea } = await import("capacitor-plugin-safe-area");
    const handle = await SafeArea.addListener("safeAreaChanged", (data) => {
      writeInsetsToRoot(data.insets as unknown as Record<string, number>);
    });
    return async () => {
      try {
        await handle.remove();
      } catch (e) {
        console.warn("[SafeArea] removing listener failed:", e);
      }
    };
  } catch (e) {
    console.warn("[SafeArea] subscribeSafeAreaChanges failed:", e);
    return async () => {};
  }
}
