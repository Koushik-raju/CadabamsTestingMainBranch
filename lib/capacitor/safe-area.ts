/**
 * Safe area inset utilities.
 * Reads SafeArea plugin on native; falls back to CSS env() on web.
 */
import { isNative } from './platform';

/**
 * Reads safe area insets and writes them as CSS custom properties on :root.
 * On native: uses capacitor-plugin-safe-area for exact pixel values.
 * On web: falls back to env() CSS variables (handled in globals.css).
 */
export async function applySafeAreaVars(): Promise<void> {
  if (typeof document === 'undefined') return;

  const native = await isNative();
  if (!native) {
    // On web the CSS vars are already set in globals.css using env() — nothing to do.
    return;
  }

  try {
    const { SafeArea } = await import('capacitor-plugin-safe-area');
    const { insets } = await SafeArea.getSafeAreaInsets();

    const root = document.documentElement;
    root.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
    root.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
    root.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
  } catch (e) {
    console.warn('[SafeArea] applySafeAreaVars failed — falling back to env():', e);
    // If the plugin fails, reset to env() values
    const root = document.documentElement;
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
    root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
  }
}
