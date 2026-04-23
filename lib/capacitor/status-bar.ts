/**
 * Status bar utilities. No-ops on web.
 * All Capacitor imports are dynamic.
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
