/**
 * FILE: components/shared/swipe-card-selector.tsx
 *
 * PURPOSE:
 *   Reusable swipe-to-select card UI. Renders a stacked card with ghost depth
 *   shadows, a large emoji + label, drag-to-change interaction, dot indicators,
 *   and arrow buttons. Used across mood-check, stress-tracker, sleep-tracker.
 *
 * LOGIC OVERVIEW:
 *   - Consumer owns selectedIndex state and passes onChange.
 *   - Drag gesture (flick threshold ±55 px) fires onChange(newIndex).
 *   - useMotionValue + animate spring the card back to x=0 after each drag.
 *   - AnimatePresence slides the card in from the swipe direction on index change.
 *   - Ghost depth cards (2 layers) give a stacked-deck visual depth effect.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   options        — array of SwipeOption (emoji, label, sublabel, gradient, dot)
 *   selectedIndex  — currently selected option index (owned by parent)
 *   onChange       — called with new index when user swipes or taps arrow/dot
 *   hint           — optional swipe hint text (default "swipe to change")
 *   SwipeOption    — exported option type
 *   SwipeCardSelector — exported component
 *
 * DEPENDENCIES:
 *   framer-motion (motion, AnimatePresence, useMotionValue, animate).
 *   lucide-react: ChevronLeft, ChevronRight. lib/haptics: hapticLight. lib/utils: cn.
 *
 * LAST UPDATED: 2026-05-04 — initial creation, extracted from mood-check-form
 */
"use client";

import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { hapticLight } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export interface SwipeOption {
  emoji: string;
  label: string;
  sublabel?: string;
  /** Tailwind gradient classes e.g. "from-rose-500 via-red-500 to-orange-500" */
  gradient: string;
  /** Tailwind bg class for the dot indicator e.g. "bg-rose-400" */
  dot: string;
}

interface SwipeCardSelectorProps {
  options: SwipeOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
  hint?: string;
}

const cardVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 130, scale: 0.86, rotate: d * 7 }),
  center: { opacity: 1, x: 0, scale: 1, rotate: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -130, scale: 0.86, rotate: d * -7 }),
};

export function SwipeCardSelector({
  options,
  selectedIndex,
  onChange,
  hint = "swipe to change",
}: SwipeCardSelectorProps) {
  const [swipeDir, setSwipeDir] = useState(1);
  const dragX = useMotionValue(0);
  const dragging = useRef(false);
  const opt = options[selectedIndex];

  const change = (newIndex: number, dir: number) => {
    if (newIndex < 0 || newIndex >= options.length) return;
    hapticLight();
    setSwipeDir(dir);
    onChange(newIndex);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    dragging.current = false;
    if (info.offset.x < -55) change(selectedIndex + 1, 1);
    else if (info.offset.x > 55) change(selectedIndex - 1, -1);
    animate(dragX, 0, { type: "spring", stiffness: 400, damping: 30 });
  };

  if (!opt) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Card stack */}
      <div className="relative select-none touch-none" style={{ paddingBottom: 10 }}>
        {/* Ghost depth layers */}
        <div
          className={cn(
            "absolute inset-x-8 bottom-0 h-full rounded-3xl opacity-20 bg-gradient-to-br",
            opt.gradient,
          )}
        />
        <div
          className={cn(
            "absolute inset-x-4 bottom-0 h-[calc(100%-6px)] rounded-3xl opacity-40 bg-gradient-to-br",
            opt.gradient,
          )}
        />

        {/* Main draggable card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -28, right: 28 }}
          dragElastic={0.2}
          style={{ x: dragX }}
          onDragStart={() => {
            dragging.current = true;
          }}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 0.975, cursor: "grabbing" }}
          className="relative z-10 cursor-grab active:cursor-grabbing overflow-hidden rounded-3xl shadow-2xl"
        >
          <AnimatePresence custom={swipeDir} mode="wait" initial={false}>
            <motion.div
              key={selectedIndex}
              custom={swipeDir}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className={cn("w-full bg-gradient-to-br", opt.gradient)}
            >
              {/* Decorative blobs */}
              <motion.div
                className="absolute -top-14 -right-14 w-56 h-56 rounded-full bg-white/10 pointer-events-none"
                animate={{ scale: 1.08, rotate: 15 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
              <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-black/8 pointer-events-none" />
              <div className="absolute top-6 right-8 w-20 h-20 rounded-full bg-white/8 pointer-events-none" />

              <div className="relative flex flex-col items-center py-12 gap-4 pointer-events-none">
                <motion.span
                  initial={{ scale: 0.55, rotate: -18, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 15, delay: 0.04 }}
                  className="text-[96px] leading-none drop-shadow-xl select-none"
                >
                  {opt.emoji}
                </motion.span>

                <div className="flex flex-col items-center gap-1">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="text-3xl font-black text-white tracking-tight"
                  >
                    {opt.label}
                  </motion.p>
                  {opt.sublabel && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.14 }}
                      className="text-sm text-white/70 font-medium"
                    >
                      {opt.sublabel}
                    </motion.p>
                  )}
                </div>

                <motion.div
                  animate={{ opacity: 0.85 }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse" }}
                  className="mt-1 flex items-center gap-2 text-white/55 text-xs font-semibold tracking-wide uppercase"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {hint}
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Dot nav + arrow buttons */}
      <div className="flex items-center justify-between px-1">
        <motion.button
          type="button"
          onClick={() => change(selectedIndex - 1, -1)}
          disabled={selectedIndex === 0}
          whileTap={{ scale: 0.82 }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
            selectedIndex === 0
              ? "border-muted text-muted-foreground opacity-30 cursor-not-allowed"
              : "border-border text-foreground hover:bg-muted",
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        <div className="flex items-center gap-2.5">
          {options.map((o, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => change(i, i > selectedIndex ? 1 : -1)}
              animate={{
                scale: i === selectedIndex ? 1.5 : 1,
                opacity: i === selectedIndex ? 1 : 0.35,
              }}
              whileTap={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn("w-2.5 h-2.5 rounded-full", o.dot)}
            />
          ))}
        </div>

        <motion.button
          type="button"
          onClick={() => change(selectedIndex + 1, 1)}
          disabled={selectedIndex === options.length - 1}
          whileTap={{ scale: 0.82 }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
            selectedIndex === options.length - 1
              ? "border-muted text-muted-foreground opacity-30 cursor-not-allowed"
              : "border-border text-foreground hover:bg-muted",
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
