/**
 * FILE: app/(auth)/sleep-tracker/page.tsx
 *
 * PURPOSE:
 *   Standalone Sleep Tracker form. Two steps:
 *     Step 1 — pick sleep quality 1–5 via SwipeCardSelector (same UI as mood-check).
 *     Step 2 — multi-select up to 5 factors that affected sleep.
 *   CMS drives score labels; SwipeCardSelector drives the picking UX.
 *
 * LOGIC OVERVIEW:
 *   - Step 1: SwipeCardSelector with 5 sleep-quality tiers. scoreIndex (0..4)
 *     maps directly to sleepScore (1..5) for submission.
 *   - Step 2: chip grid up to 5 factors from bubbleQuestion CMS options.
 *     An animated counter badge pops when factor count changes.
 *   - useSleepEntries(1) seeds the initial scoreIndex from the most recent entry.
 *     A ref flag prevents re-seeding on background SWR refetches.
 *   - Submit POSTs via submitSleepEntry then routes to /sleep-tracker/report.
 *   - Haptics on every interaction; spring chips stagger into step 2.
 *
 * KEY VARIABLES / EXPORTS:
 *   scoreIndex       — 0..4 sleep quality index (maps to sleepScore 1..5)
 *   lastEntrySeeded  — ref flag — prevents re-seeding on background SWR refetches
 *   SleepTrackerPage — default export
 *
 * DEPENDENCIES:
 *   SwipeCardSelector, useSleepTrackerAssessment, useSleepEntries, submitSleepEntry,
 *   PageHeader, Button, Skeleton. framer-motion, lib/haptics.
 *
 * LAST UPDATED: 2026-05-04 — toned-down gradients; last-response default via useSleepEntries
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { SwipeCardSelector } from "@/components/shared/swipe-card-selector";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  submitSleepEntry,
  useSleepEntries,
  useSleepTrackerAssessment,
} from "@/hooks/sleep-tracker/use-sleep-tracker";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";

const MAX_FACTORS = 5;

const SLEEP_OPTIONS = [
  {
    emoji: "😴",
    label: "Very Poorly",
    sublabel: "Barely slept",
    gradient: "from-slate-400 via-slate-500 to-zinc-500",
    dot: "bg-slate-400",
  },
  {
    emoji: "😪",
    label: "Poorly",
    sublabel: "Restless night",
    gradient: "from-indigo-300 via-blue-300 to-sky-400",
    dot: "bg-indigo-300",
  },
  {
    emoji: "😑",
    label: "Okay",
    sublabel: "Could have been better",
    gradient: "from-blue-300 via-indigo-300 to-violet-300",
    dot: "bg-blue-300",
  },
  {
    emoji: "😊",
    label: "Well",
    sublabel: "Pretty good sleep",
    gradient: "from-violet-300 via-purple-300 to-indigo-400",
    dot: "bg-violet-300",
  },
  {
    emoji: "🤩",
    label: "Very Well",
    sublabel: "Slept like a dream!",
    gradient: "from-purple-400 via-violet-400 to-fuchsia-400",
    dot: "bg-purple-300",
  },
];

const stepVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 44 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -44 }),
};

export default function SleepTrackerPage() {
  const router = useRouter();
  const { scoreQuestion, bubbleQuestion, isLoading } = useSleepTrackerAssessment();
  const { data: recentSleep } = useSleepEntries(1);

  const [step, setStep] = useState<1 | 2>(1);
  const [scoreIndex, setScoreIndex] = useState(2); // default "Okay" until last entry loads
  const [factors, setFactors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);

  /*
   * Seed the swipe card from the user's most recent sleep entry.
   * sleepScore is 1..5; SLEEP_OPTIONS index is 0..4.
   * The ref prevents re-seeding if SWR revalidates in the background
   * after the user has already started interacting.
   */
  const lastEntrySeeded = useRef(false);
  useEffect(() => {
    if (lastEntrySeeded.current) return;
    const score = recentSleep?.items[0]?.sleepScore;
    if (score != null && score >= 1 && score <= 5) {
      setScoreIndex(score - 1);
      lastEntrySeeded.current = true;
    }
  }, [recentSleep]);

  const bubbleOptions = useMemo(
    () => (bubbleQuestion?.options ?? []).map((o) => ({ id: o.id, label: o.label })),
    [bubbleQuestion],
  );

  /* CMS may store labels with a "I slept " or similar preamble — strip it. */
  const scoreLabels = useMemo(() => {
    return (scoreQuestion?.smileys ?? []).map((s) => {
      const trimmed = s.replace(/^\s*i\s+(slept|sleep)\s*/i, "").trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    });
  }, [scoreQuestion]);

  const q2Title = useMemo(() => {
    const t = bubbleQuestion?.title?.trim();
    if (!t || /^question\s*\d+$/i.test(t)) return "What affected your sleep?";
    return t;
  }, [bubbleQuestion]);

  /* Merge CMS labels into swipe options where available */
  const swipeOptions = SLEEP_OPTIONS.map((o, i) => ({
    ...o,
    label: scoreLabels[i] ? scoreLabels[i] : o.label,
  }));

  const toggleFactor = (label: string) => {
    hapticLight();
    setFactors((prev) =>
      prev.includes(label)
        ? prev.filter((f) => f !== label)
        : [...prev, label].slice(0, MAX_FACTORS),
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
    setSubmitError(null);
    try {
      await submitSleepEntry({
        sleepScore: scoreIndex + 1,
        sleepLabel: swipeOptions[scoreIndex]?.label,
        factors,
      });
      router.replace("/sleep-tracker/report");
    } catch (e) {
      console.error("[SleepTracker] submit failed", e);
      setSubmitError("Could not save your sleep entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTier = SLEEP_OPTIONS[scoreIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Sleep Tracker" fallback="/home" />
        <div className="px-4 flex flex-col gap-4 pt-2">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Sleep Tracker"
        fallback="/home"
        right={
          <Link
            href="/sleep-tracker/report"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600"
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
                  s < step ? "#6366f1" : s === step ? "#4f46e5" : "hsl(var(--muted))",
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
                <h2 className="text-lg font-bold leading-snug">
                  How well did you sleep last night?
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Swipe to find your sleep quality
                </p>
              </div>

              <SwipeCardSelector
                options={swipeOptions}
                selectedIndex={scoreIndex}
                onChange={setScoreIndex}
                hint="swipe to change"
              />

              <Button
                className="w-full h-12 rounded-2xl text-base font-semibold"
                size="lg"
                onClick={handleContinue}
              >
                {scoreQuestion?.continueLabel ?? "Continue"}
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
              {/* Sleep quality reminder */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r ${selectedTier.gradient} text-white shadow-md`}
              >
                <span className="text-2xl">{selectedTier.emoji}</span>
                <div>
                  <p className="text-xs text-white/75 font-medium">Sleep quality</p>
                  <p className="text-sm font-bold">{swipeOptions[scoreIndex]?.label}</p>
                </div>
              </motion.div>

              <div className="px-1">
                <h2 className="text-lg font-bold leading-snug">{q2Title}</h2>
                {bubbleQuestion?.subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">{bubbleQuestion.subtitle}</p>
                )}
                {/* Animated factor counter */}
                <div className="flex items-center gap-1.5 mt-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={factors.length}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                        factors.length > 0
                          ? "bg-indigo-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {factors.length}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-xs text-muted-foreground">of {MAX_FACTORS} selected</span>
                </div>
              </div>

              {bubbleOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">
                  No factor options configured in CMS yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 px-1">
                  {bubbleOptions.map((opt, idx) => {
                    const isSelected = factors.includes(opt.label);
                    const isDisabled = !isSelected && factors.length >= MAX_FACTORS;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleFactor(opt.label)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: isDisabled ? 0.95 : 1 }}
                        transition={{
                          delay: idx * 0.04,
                          type: "spring",
                          stiffness: 380,
                          damping: 20,
                        }}
                        whileTap={isDisabled ? {} : { scale: 0.88 }}
                        className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                            : isDisabled
                              ? "border-border bg-muted text-muted-foreground opacity-50"
                              : "border-border bg-card text-foreground hover:border-indigo-300"
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {submitError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive px-1"
                >
                  {submitError}
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
                  {isSubmitting ? "Saving…" : "Save sleep"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
