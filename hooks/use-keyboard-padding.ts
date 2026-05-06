/**
 * FILE: hooks/use-keyboard-padding.ts
 *
 * PURPOSE:
 *   Returns a dynamic paddingBottom value that accounts for the on-screen keyboard
 *   height on mobile (iOS/Android WebView / Capacitor).
 *
 * LOGIC OVERVIEW:
 *   On iOS inside a Capacitor WebView, window.innerHeight never changes when the soft
 *   keyboard opens — the keyboard simply overlays the viewport. window.visualViewport.height
 *   does shrink, so the difference between the two values is the keyboard height.
 *   We listen to visualViewport "resize" and "scroll" events (both fire on iOS when the
 *   keyboard shows/hides) and return `keyboardHeight + basePadding` so callers can apply
 *   it as paddingBottom on a scrollable container, keeping focused inputs visible above
 *   the keyboard.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   base              — minimum padding when keyboard is hidden (default 32 px)
 *   useKeyboardPadding — default export; returns a number (px) for paddingBottom
 *
 * DEPENDENCIES:
 *   React useEffect, useState — standard hooks
 *
 * LAST UPDATED: 2026-05-06 — initial creation for auth page keyboard-overlap fix
 */

import { useEffect, useState } from "react";

/*
 * On iOS the keyboard overlays the WebView without resizing window.innerHeight.
 * visualViewport.height reflects the actual visible area, so the gap between the
 * two is the keyboard height. We add a base padding on top so the input isn't
 * flush against the keyboard edge.
 */
export function useKeyboardPadding(base = 32): number {
  const [padding, setPadding] = useState(base);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      setPadding(Math.max(base, keyboardHeight + base));
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [base]);

  return padding;
}
