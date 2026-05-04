/**
 * FILE: app/(auth)/mood-tracker/page.tsx
 *
 * PURPOSE:
 *   Standalone Mood Tracker form. Two steps:
 *     Step 1 — pick mood quality 1–5 via SwipeCardSelector.
 *     Step 2 — multi-select up to 5 feelings from CMS bubble options.
 *   Question content pulled from CMS via useMoodTrackerAssessment.
 *
 * LOGIC OVERVIEW:
 *   - MoodTrackerContent is wrapped in <Suspense> by the default export so
 *     useSearchParams() satisfies Next.js SSR/prerender requirements.
 *   - ?mood=<1-5> query param pre-selects the swipe card index on arrival.
 *     If no param, the most recent mood entry (useMoodEntries(1)) seeds the index.
 *   - Step 1: SwipeCardSelector with 5 mood tiers; CMS smiley labels replace
 *     default labels where available.
 *   - Step 2: Spring-animated chip grid for feelings (max 5). Animated counter
 *     badge pops on each toggle. Haptics on every interaction.
 *   - Submit POSTs via submitMoodEntry then routes to /mood-tracker/report.
 *
 * KEY VARIABLES / EXPORTS:
 *   smileyIndex        — 0..4 mood index (maps to moodScore 1..5)
 *   lastEntrySeeded    — ref flag — ensures last-entry only seeds once, not on every SWR refetch
 *   MoodTrackerPage    — default export (Suspense wrapper)
 *   MoodTrackerContent — inner client component with form logic
 *
 * DEPENDENCIES:
 *   SwipeCardSelector, useMoodTrackerAssessment, useMoodEntries, submitMoodEntry,
 *   PageHeader, Button, Skeleton. framer-motion, lib/haptics.
 *
 * LAST UPDATED: 2026-05-04 — toned-down gradients; last-response default via useMoodEntries
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { SwipeCardSelector } from "@/components/shared/swipe-card-selector";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  submitMoodEntry,
  useMoodEntries,
  useMoodTrackerAssessment,
} from "@/hooks/mood-tracker/use-mood-tracker";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";

const MAX_FEELINGS = 5;

const MOOD_OPTIONS = [
  {
    emoji: "😔",
    label: "Depressed",
    sublabel: "Feeling really down",
    gradient: "from-rose-400 via-red-400 to-orange-400",
    dot: "bg-rose-300",
  },
  {
    emoji: "😕",
    label: "Sad",
    sublabel: "Not at my best",
    gradient: "from-orange-300 via-amber-400 to-yellow-400",
    dot: "bg-orange-300",
  },
  {
    emoji: "😌",
    label: "Neutral",
    sublabel: "Holding steady",
    gradient: "from-yellow-300 via-lime-300 to-green-400",
    dot: "bg-yellow-300",
  },
  {
    emoji: "😊",
    label: "Happy",
    sublabel: "Feeling pretty great",
    gradient: "from-teal-300 via-emerald-400 to-green-400",
    dot: "bg-teal-300",
  },
  {
    emoji: "🤩",
    label: "Overjoyed",
    sublabel: "On top of the world!",
    gradient: "from-violet-400 via-purple-400 to-fuchsia-400",
    dot: "bg-violet-300",
  },
];

const stepVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 44 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -44 }),
};

function MoodTrackerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { smileyQuestion, bubbleQuestion, isLoading } = useMoodTrackerAssessment();
  const { data: recentMoods } = useMoodEntries(1);

  /* Pre-select a mood card if the home hero pill linked here with ?mood=<1-5>.
   * Mood 1-5 maps to SwipeCardSelector index 0-4. Out-of-range falls back to 2. */
  const moodParam = searchParams.get("mood");
  const initialSmileyIndex = useMemo(() => {
    const n = moodParam ? parseInt(moodParam, 10) : NaN;
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n - 1 : 2;
  }, [moodParam]);

  const [step, setStep] = useState<1 | 2>(1);
  const [smileyIndex, setSmileyIndex] = useState<number>(initialSmileyIndex);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);

  /*
   * Seed the swipe card from the user's last mood entry when no ?mood= param is
   * present. The ref prevents re-seeding on every SWR background refetch — we
   * only want to apply the last entry once, on first data arrival.
   */
  const lastEntrySeeded = useRef(false);
  useEffect(() => {
    if (moodParam) return; // query param takes precedence
    if (lastEntrySeeded.current) return;
    const score = recentMoods?.items[0]?.moodScore;
    if (score != null && score >= 1 && score <= 5) {
      setSmileyIndex(score - 1);
      lastEntrySeeded.current = true;
    }
  }, [recentMoods, moodParam]);

  const bubbleOptions = useMemo(
    () => (bubbleQuestion?.options ?? []).map((o) => ({ id: o.id, label: o.label })),
    [bubbleQuestion],
  );

  /* Strip the "I'm feeling " preamble the CMS uses on each smiley label. */
  const smileyLabels = useMemo(() => {
    return (smileyQuestion?.smileys ?? []).map((s) => {
      const trimmed = s.replace(/^\s*i['']m feeling\s*/i, "").trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    });
  }, [smileyQuestion]);

  const q2Title = useMemo(() => {
    const t = bubbleQuestion?.title?.trim();
    if (!t || /^question\s*\d+$/i.test(t))
      return "Choose up to 5 emotions that reflect your current state.";
    return t;
  }, [bubbleQuestion]);

  /* Merge CMS labels into swipe options where available */
  const swipeOptions = MOOD_OPTIONS.map((o, i) => ({
    ...o,
    label: smileyLabels[i] ? smileyLabels[i] : o.label,
  }));

  const selectedTier = MOOD_OPTIONS[smileyIndex];

  const toggleFeeling = (label: string) => {
    hapticLight();
    setFeelings((prev) =>
      prev.includes(label)
        ? prev.filter((f) => f !== label)
        : [...prev, label].slice(0, MAX_FEELINGS),
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
      await submitMoodEntry({
        moodScore: smileyIndex + 1,
        moodLabel: swipeOptions[smileyIndex]?.label,
        feelings,
      });
      router.replace("/mood-tracker/report");
    } catch (e) {
      console.error("[MoodTracker] submit failed", e);
      setSubmitError("Could not save your mood. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Mood Tracker" fallback="/home" />
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
        title="Mood Tracker"
        fallback="/home"
        right={
          <Link
            href="/mood-tracker/report"
            className="flex items-center gap-1 text-xs font-medium text-violet-600"
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
                  s < step ? "#7c3aed" : s === step ? "#6d28d9" : "hsl(var(--muted))",
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
                  {smileyQuestion?.title?.trim() && !/^question\s*\d+$/i.test(smileyQuestion.title)
                    ? smileyQuestion.title
                    : "How are you feeling right now?"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">Swipe to find your mood</p>
              </div>

              <SwipeCardSelector
                options={swipeOptions}
                selectedIndex={smileyIndex}
                onChange={setSmileyIndex}
                hint="swipe to change mood"
              />

              <Button
                className="w-full h-12 rounded-2xl text-base font-semibold"
                size="lg"
                onClick={handleContinue}
              >
                {smileyQuestion?.continueLabel ?? "Continue"}
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
              {/* Mood reminder badge */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r ${selectedTier.gradient} text-white shadow-md`}
              >
                <span className="text-2xl">{selectedTier.emoji}</span>
                <div>
                  <p className="text-xs text-white/75 font-medium">Your mood</p>
                  <p className="text-sm font-bold">{swipeOptions[smileyIndex]?.label}</p>
                </div>
              </motion.div>

              <div className="px-1">
                <h2 className="text-lg font-bold leading-snug">{q2Title}</h2>
                {bubbleQuestion?.subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">{bubbleQuestion.subtitle}</p>
                )}
                {/* Animated feeling counter */}
                <div className="flex items-center gap-1.5 mt-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={feelings.length}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                        feelings.length > 0
                          ? "bg-violet-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {feelings.length}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-xs text-muted-foreground">of {MAX_FEELINGS} selected</span>
                </div>
              </div>

              {bubbleOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">
                  No feeling options configured in CMS yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 px-1">
                  {bubbleOptions.map((opt, idx) => {
                    const isSelected = feelings.includes(opt.label);
                    const isDisabled = !isSelected && feelings.length >= MAX_FEELINGS;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleFeeling(opt.label)}
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
                            ? "border-violet-500 bg-violet-500 text-white shadow-sm"
                            : isDisabled
                              ? "border-border bg-muted text-muted-foreground opacity-50"
                              : "border-border bg-card text-foreground hover:border-violet-300"
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
                  {isSubmitting ? "Saving…" : "Save mood"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MoodTrackerPage() {
  return (
    <Suspense>
      <MoodTrackerContent />
    </Suspense>
  );
}
