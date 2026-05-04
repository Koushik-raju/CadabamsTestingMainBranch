/**
 * FILE: components/journey/xp-float.tsx
 *
 * PURPOSE:
 *   Floating XP reward badge that animates in and out. Appears briefly when
 *   show prop transitions from false to true, fades after ~900ms, disappears after ~1.3s.
 *
 * LOGIC OVERVIEW:
 *   Watches the show prop. On transition to true, sets visible=true and initiates
 *   timers: after 900ms sets fading=true (opacity-0, translate up), after 1300ms
 *   sets visible=false (unmount). If show transitions to false before timers
 *   complete, clears timers to prevent memory leaks.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   show      — boolean to trigger the animation (typically on task completion)
 *   visible   — controls render (null if false)
 *   fading    — toggles fade+translate animation classes
 *   XpFloat   — default export component
 *
 * DEPENDENCIES:
 *   lucide-react Zap icon
 *   lib/utils: cn for classname merging
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface XpFloatProps {
  show: boolean;
}

export function XpFloat({ show }: XpFloatProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    setFading(false);

    const fadeTimer = setTimeout(() => setFading(true), 900);
    const hideTimer = setTimeout(() => setVisible(false), 1300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none",
        "flex items-center gap-1 bg-primary text-primary-foreground text-sm font-extrabold px-3 py-1.5 rounded-full shadow-[var(--sh-glow-orange)] shadow-primary/30",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        fading && "transition-all duration-400 opacity-0 -translate-y-6",
      )}
      style={{ top: "20%" }}
    >
      <Zap className="w-3.5 h-3.5" />
      +10 XP
    </div>
  );
}
