/**
 * Keyboard management for Capacitor.
 * Adds/removes 'keyboard-open' class on body and updates --keyboard-height CSS var.
 * No-ops on web.
 */
import { isNative } from './platform';

/**
 * Registers Keyboard show/hide listeners.
 * Returns a cleanup function that removes the listeners.
 */
export async function setupKeyboardListeners(): Promise<() => void> {
  if (!(await isNative())) return () => {};

  try {
    const { Keyboard } = await import('@capacitor/keyboard');

    const showHandle = await Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.classList.add('keyboard-open');
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${info.keyboardHeight}px`
      );
    });

    const hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    });

    return () => {
      showHandle.remove();
      hideHandle.remove();
    };
  } catch (e) {
    console.warn('[Keyboard] setupKeyboardListeners failed:', e);
    return () => {};
  }
}
