/**
 * FILE: app/(auth)/stress-tracker/page.tsx
 *
 * PURPOSE:
 *   Standalone Stress Tracker form. Two steps:
 *     Step 1 — pick stress level 1–5 via SwipeCardSelector (same UI as mood-check).
 *     Step 2 — multi-select stressors via spring-animated chips.
 *   Submits to POST /:campus/stress-tracker.
 *
 * LOGIC OVERVIEW:
 *   - Step 1: SwipeCardSelector with 5 stress-level options (emoji + gradient).
 *     selectedLevelIndex (0..4) maps to STRESS_LEVEL_OPTIONS[i].
 *   - Step 2: Chip multi-select using STRESS_REASONS. Selected level shown as
 *     a reminder badge at top.
 *   - Submit posts and routes to /stress-tracker/report.
 *   - useLatestStressEntry seeds the initial level from the user's last entry.
 *     A ref flag prevents re-seeding on every SWR background refetch.
 *   - Framer-motion animates step slide transitions and chip spring entrance.
 *     Haptics fire on every interaction.
 *
 * KEY VARIABLES / EXPORTS:
 *   levelIndex         — 0..4 index into STRESS_LEVEL_OPTIONS
 *   lastEntrySeeded    — ref flag — prevents re-seeding on background SWR refetches
 *   StressTrackerPage  — default export
 *
 * DEPENDENCIES:
 *   SwipeCardSelector, useLatestStressEntry, submitStressEntry, PageHeader, Button.
 *   framer-motion, lib/haptics.
 *
 * LAST UPDATED: 2026-05-04 — toned-down gradients; last-response default via useLatestStressEntry
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { SwipeCardSelector, type SwipeOption } from "@/components/shared/swipe-card-selector";
import { Button } from "@/components/ui/button";
import {
  STRESS_REASONS,
  submitStressEntry,
  useLatestStressEntry,
} from "@/hooks/stress-tracker/use-stress-tracker";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";

/* Map STRESS_LEVELS (score 1..5) to SwipeOption shape */
const STRESS_LEVEL_OPTIONS: (SwipeOption & { score: number; label: string })[] = [
  {
    score: 1,
    emoji: "😌",
    label: "Very Low",
    sublabel: "Calm and relaxed",
    gradient: "from-emerald-300 via-teal-300 to-green-400",
    dot: "bg-emerald-300",
  },
  {
    score: 2,
    emoji: "🙂",
    label: "Low",
    sublabel: "Mostly at ease",
    gradient: "from-lime-300 via-green-300 to-teal-300",
    dot: "bg-lime-300",
  },
  {
    score: 3,
    emoji: "😐",
    label: "Moderate",
    sublabel: "Feeling the tension",
    gradient: "from-amber-300 via-yellow-300 to-lime-300",
    dot: "bg-amber-300",
  },
  {
    score: 4,
    emoji: "😬",
    label: "High",
    sublabel: "Pretty stressed out",
    gradient: "from-orange-300 via-red-300 to-rose-300",
    dot: "bg-orange-300",
  },
  {
    score: 5,
    emoji: "😤",
    label: "Very High",
    sublabel: "Feeling overwhelmed",
    gradient: "from-red-400 via-rose-400 to-pink-400",
    dot: "bg-red-300",
  },
];

const stepVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 44 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -44 }),
};

export default function StressTrackerPage() {
  const router = useRouter();
  const { latest } = useLatestStressEntry();

  const [step, setStep] = useState<1 | 2>(1);
  const [levelIndex, setLevelIndex] = useState(2); // default Moderate until last entry loads
  const [reasons, setReasons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);

  /*
   * Seed the swipe card from the user's most recent stress entry.
   * stressLevel is 1..5; STRESS_LEVEL_OPTIONS index is 0..4.
   * The ref prevents re-seeding if SWR revalidates in the background
   * after the user has already started interacting.
   */
  const lastEntrySeeded = useRef(false);
  useEffect(() => {
    if (lastEntrySeeded.current) return;
    const level = latest?.stressLevel;
    if (level != null && level >= 1 && level <= 5) {
      setLevelIndex(level - 1);
      lastEntrySeeded.current = true;
    }
  }, [latest]);

  const selected = STRESS_LEVEL_OPTIONS[levelIndex];

  const toggleReason = (reason: string) => {
    hapticLight();
    setReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );
  };

  const handleContinue = () => {
    hapticMedium();
    setDirection(1);
    setStep(2);
  };

  const handleBack = () => {
    hapticLight();
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async () => {
    hapticSuccess();
    setIsSubmitting(true);
    setError(null);
    try {
      await submitStressEntry({
        stressLevel: selected.score,
        stressLevelLabel: selected.label,
        stressReasons: reasons,
      });
      router.replace("/stress-tracker/report");
    } catch (e) {
      console.error("[StressTracker] submit failed", e);
      setError("Could not save your stress entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Stress Tracker"
        fallback="/home"
        right={
          <Link
            href="/stress-tracker/report"
            className="flex items-center gap-1 text-xs font-medium text-rose-600"
          >
            <BarChart3 size={14} /> Report
          </Link>
        }
      />

      <div className="px-4 flex flex-col gap-5">
        {/* Step progress pills */}
        <div className="flex items-center gap-2 pt-2">
          {[1, 2].map((s) => (
            <motion.div
              key={s}
              animate={{
                width: s === step ? 32 : 8,
                backgroundColor:
                  s < step ? "#f43f5e" : s === step ? "#e11d48" : "hsl(var(--muted))",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="h-2 rounded-full flex-shrink-0"
            />
          ))}
          <div className="flex-1" />
          <span className="text-xs font-medium text-muted-foreground">Step {step} of 2</span>
        </div>

        <AnimatePresence custom={direction} mode="wait" initial={false}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.26, ease: "easeInOut" }}
              className="flex flex-col gap-5"
            >
              <div className="px-1">
                <h2 className="text-lg font-bold leading-snug">What's your stress level today?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Swipe to find your level</p>
              </div>

              <SwipeCardSelector
                options={STRESS_LEVEL_OPTIONS}
                selectedIndex={levelIndex}
                onChange={setLevelIndex}
                hint="swipe to change level"
              />

              <Button
                className="w-full h-12 rounded-2xl text-base font-semibold"
                size="lg"
                onClick={handleContinue}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.26, ease: "easeInOut" }}
              className="flex flex-col gap-5"
            >
              {/* Level reminder badge */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r ${selected.gradient} text-white shadow-md`}
              >
                <span className="text-2xl">{selected.emoji}</span>
                <div>
                  <p className="text-xs text-white/75 font-medium">Stress level</p>
                  <p className="text-sm font-bold">{selected.label}</p>
                </div>
              </motion.div>

              <div className="px-1">
                <h2 className="text-lg font-bold leading-snug">What are you stressed about?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Pick all that apply.</p>
              </div>

              <div className="flex flex-wrap gap-2 px-1">
                {STRESS_REASONS.map((reason, idx) => {
                  const isSelected = reasons.includes(reason);
                  return (
                    <motion.button
                      key={reason}
                      type="button"
                      onClick={() => toggleReason(reason)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: idx * 0.04,
                        type: "spring",
                        stiffness: 380,
                        damping: 20,
                      }}
                      whileTap={{ scale: 0.88 }}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                          : "border-border bg-card text-foreground hover:border-rose-300"
                      }`}
                    >
                      {reason}
                    </motion.button>
                  );
                })}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive px-1"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl text-base font-semibold"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving…" : "Save"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
