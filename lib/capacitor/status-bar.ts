/**
 * FILE: lib/capacitor/status-bar.ts
 *
 * PURPOSE:
 *   Capacitor StatusBar plugin wrapper for controlling native status bar appearance
 *   (background color, text style, visibility). No-ops on web.
 *
 * LOGIC OVERVIEW:
 *   1. Each function wraps a StatusBar API call in isNative() check.
 *   2. All Capacitor imports are dynamic to avoid native module errors on web.
 *   3. Errors are caught and logged; no exceptions bubble up.
 *   4. setStatusBarColor sets the native bar background (Android) or no-ops (iOS with overlay mode).
 *   5. setStatusBarLight/Dark sets icon/text color for readability against the background.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   setStatusBarLight      — sets clock/battery icons to dark (readable on light bg)
 *   setStatusBarDark       — sets icons to light (readable on dark bg)
 *   hideStatusBar / showStatusBar — controls visibility
 *   setStatusBarColor      — sets native bar background color (hex string)
 *
 * DEPENDENCIES:
 *   @capacitor/status-bar  — native plugin
 *   ./platform             — isNative() check
 *
 * LAST UPDATED: 2026-05-05 — added setStatusBarColor for color blending (Phase 3.5)
 */
import { isNative } from "./platform";

export async function setStatusBarLight(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
  } catch (e) {
    console.warn("[StatusBar] setStatusBarLight failed:", e);
  }
}

export async function setStatusBarDark(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (e) {
    console.warn("[StatusBar] setStatusBarDark failed:", e);
  }
}

export async function hideStatusBar(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.hide();
  } catch (e) {
    console.warn("[StatusBar] hide failed:", e);
  }
}

export async function showStatusBar(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.show();
  } catch (e) {
    console.warn("[StatusBar] show failed:", e);
  }
}

export async function setStatusBarColor(color: string): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    /*
     * On Android with overlaysWebView: false, sets the native status bar background color.
     * On iOS with overlaysWebView: true, the WebView extends behind the status bar —
     * the page's own background color shows through naturally. We still call this
     * for Android consistency.
     */
    await StatusBar.setBackgroundColor({ color });
  } catch (e) {
    console.warn("[StatusBar] setBackgroundColor failed:", e);
  }
}
