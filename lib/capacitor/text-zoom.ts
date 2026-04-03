/**
 * TextZoom utility — prevents iOS accessibility text-size from breaking layout.
 * No-ops on non-iOS platforms.
 */
import { isIOS } from './platform';

/**
 * Forces TextZoom to 1.0 on iOS so the OS accessibility "Larger Text" setting
 * does not override in-app font sizes.
 */
export async function preventTextZoom(): Promise<void> {
  if (!(await isIOS())) return;

  try {
    const { TextZoom } = await import('@capacitor/text-zoom');
    await TextZoom.set({ value: 1.0 });
  } catch (e) {
    console.warn('[TextZoom] preventTextZoom failed:', e);
  }
}
