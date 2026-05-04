/**
 * FILE: components/journey/mood-check-form.tsx
 *
 * PURPOSE:
 *   Mobile-first mood check-in form. One question at a time with a large
 *   swipeable mood card via SwipeCardSelector — flick left/right or tap arrow
 *   buttons to cycle through 5 moods. No small emoji grid anywhere.
 *
 * LOGIC OVERVIEW:
 *   - currentQ tracks which question (0-indexed) is shown.
 *   - moodIndices maps question index → MOOD_STEPS index (0..4), default 2 (Okay).
 *   - SwipeCardSelector owns the drag/dot/arrow UI; this form owns question
 *     progression, answer accumulation, and submit.
 *   - answers are written on every mood change so the final submit just reads them.
 *   - q_0 pre-seeded from defaultMoodValue when caller provides one.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   currentQ     — which question is active (0..questions.length-1)
 *   moodIndices  — per-question MOOD_STEPS index
 *   MoodCheckForm — exported form component
 *
 * DEPENDENCIES:
 *   SwipeCardSelector, framer-motion, shadcn Button.
 *   lucide-react: ChevronLeft, ChevronRight, Sparkles.
 *   lib/haptics: hapticMedium, hapticSuccess.
 *
 * LAST UPDATED: 2026-05-04 — toned-down gradients (300-400 range)
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { SwipeCardSelector } from "@/components/shared/swipe-card-selector";
import { Button } from "@/components/ui/button";
import { hapticMedium, hapticSuccess } from "@/lib/haptics";

interface MoodQuestion {
  question: string;
  value: number;
}

interface MoodCheckFormProps {
  questions?: MoodQuestion[];
  onSubmit: (answers: Record<string, number>) => Promise<void>;
  isSubmitting?: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  defaultMoodValue?: number;
}

const MOOD_OPTIONS = [
  {
    value: 2,
    emoji: "😔",
    label: "Very Low",
    sublabel: "Feeling really down",
    gradient: "from-rose-400 via-red-400 to-orange-400",
    dot: "bg-rose-300",
  },
  {
    value: 4,
    emoji: "😕",
    label: "Low",
    sublabel: "Not at my best",
    gradient: "from-orange-300 via-amber-400 to-yellow-400",
    dot: "bg-orange-300",
  },
  {
    value: 6,
    emoji: "😌",
    label: "Okay",
    sublabel: "Holding steady",
    gradient: "from-yellow-300 via-lime-300 to-green-400",
    dot: "bg-yellow-300",
  },
  {
    value: 8,
    emoji: "😊",
    label: "Good",
    sublabel: "Feeling pretty great",
    gradient: "from-teal-300 via-emerald-400 to-green-400",
    dot: "bg-teal-300",
  },
  {
    value: 10,
    emoji: "🤩",
    label: "Amazing",
    sublabel: "On top of the world!",
    gradient: "from-violet-400 via-purple-400 to-fuchsia-400",
    dot: "bg-violet-300",
  },
];

function snapIndex(value: number): number {
  let best = 0;
  let bestDist = Infinity;
  MOOD_OPTIONS.forEach((o, i) => {
    const d = Math.abs(o.value - value);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

const DEFAULT_QUESTIONS: MoodQuestion[] = [
  { question: "How are you feeling right now?", value: 6 },
  { question: "How stressed do you feel?", value: 6 },
  { question: "How energetic do you feel?", value: 6 },
];

export function MoodCheckForm({
  questions = DEFAULT_QUESTIONS,
  onSubmit,
  isSubmitting = false,
  title = "How are you feeling?",
  submitLabel = "Save Mood",
  defaultMoodValue,
}: MoodCheckFormProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [questionDir, setQuestionDir] = useState(1);

  const initial0 = defaultMoodValue != null ? snapIndex(defaultMoodValue) : 2;
  const [moodIndices, setMoodIndices] = useState<Record<number, number>>(
    Object.fromEntries(questions.map((_, i) => [i, i === 0 ? initial0 : 2])),
  );

  const [answers, setAnswers] = useState<Record<string, number>>(
    Object.fromEntries(
      questions.map((_, i) => [`q_${i}`, MOOD_OPTIONS[i === 0 ? initial0 : 2].value]),
    ),
  );

  const moodIndex = moodIndices[currentQ] ?? 2;
  const isLast = currentQ === questions.length - 1;

  const handleMoodChange = (newIndex: number) => {
    setMoodIndices((prev) => ({ ...prev, [currentQ]: newIndex }));
    setAnswers((prev) => ({ ...prev, [`q_${currentQ}`]: MOOD_OPTIONS[newIndex].value }));
  };

  const handleNext = async () => {
    if (!isLast) {
      hapticMedium();
      setQuestionDir(1);
      setCurrentQ((q) => q + 1);
    } else {
      hapticSuccess();
      await onSubmit(answers);
    }
  };

  const handlePrev = () => {
    if (currentQ === 0) return;
    hapticMedium();
    setQuestionDir(-1);
    setCurrentQ((q) => q - 1);
  };

  const qVariants = {
    enter: (d: number) => ({ opacity: 0, y: d * 10, filter: "blur(3px)" }),
    center: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: (d: number) => ({ opacity: 0, y: d * -10, filter: "blur(3px)" }),
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-1"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
          <Sparkles className="w-3 h-3" />
          {title}
        </div>
        <div className="flex items-center gap-1">
          {questions.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === currentQ ? 20 : 6,
                backgroundColor: i < currentQ ? "#7c3aed" : i === currentQ ? "#6d28d9" : "#e5e7eb",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      </motion.div>

      {/* Question text */}
      <div className="overflow-hidden min-h-[28px]">
        <AnimatePresence custom={questionDir} mode="wait" initial={false}>
          <motion.p
            key={currentQ}
            custom={questionDir}
            variants={qVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-lg font-bold text-foreground px-1 leading-snug"
          >
            {questions[currentQ].question}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Swipe card */}
      <SwipeCardSelector
        options={MOOD_OPTIONS}
        selectedIndex={moodIndex}
        onChange={handleMoodChange}
      />

      {/* Navigation */}
      <div className="flex gap-2 pt-1">
        {currentQ > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="px-4 rounded-2xl"
            onClick={handlePrev}
            disabled={isSubmitting}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <Button
          className="flex-1 h-12 rounded-2xl text-base font-semibold"
          size="lg"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Saving…"
          ) : isLast ? (
            submitLabel
          ) : (
            <span className="flex items-center gap-1.5">
              Next <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
