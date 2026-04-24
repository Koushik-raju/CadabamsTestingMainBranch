/**
 * FILE: components/journey/mood-check-form.tsx
 *
 * PURPOSE:
 *   Mobile-first mood check-in form. Renders a hero gradient card as the
 *   intro, then one grouped card per question with a 5-step emoji selector.
 *   Follows the Compact Card UI language in docs/DESIGN_GUIDELINES.md.
 *
 * LOGIC OVERVIEW:
 *   - Each question maps to a numeric value in state (1–10 scale, but the
 *     UI exposes 5 discrete steps mapped to values 2, 4, 6, 8, 10).
 *   - User taps an emoji to select a mood; tapping updates answers state.
 *   - Submit delegates to parent onSubmit(answers).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   questions     — optional list of { question, value }; defaults provided.
 *   onSubmit      — async callback receiving answers keyed by q_<i>.
 *   isSubmitting  — disables the submit CTA and shows a saving label.
 *   title/subtitle/submitLabel — customisable copy for the hero + CTA.
 *   MoodCheckForm — exported form component.
 *
 * DEPENDENCIES:
 *   shadcn: Card, CardContent, Button. lucide-react: Sparkles, Check.
 *   lib/utils: cn.
 *
 * LAST UPDATED: 2026-04-24 — filter undefined answers before calling onSubmit to satisfy Record<string, number> contract.
 */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

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
  /** Pre-selected mood value (2–10) from the home header selection. Overrides q_0's default. */
  defaultMoodValue?: number;
}

const MOOD_STEPS: { value: number; emoji: string; label: string; gradient: string }[] = [
  { value: 2, emoji: "😟", label: "Very Low", gradient: "from-red-500 to-rose-600" },
  { value: 4, emoji: "😐", label: "Low", gradient: "from-orange-500 to-amber-500" },
  { value: 6, emoji: "😊", label: "Neutral", gradient: "from-amber-400 to-yellow-500" },
  { value: 8, emoji: "😄", label: "Good", gradient: "from-emerald-500 to-teal-600" },
  { value: 10, emoji: "🤩", label: "Great", gradient: "from-violet-500 to-purple-600" },
];

const DEFAULT_QUESTIONS: MoodQuestion[] = [
  { question: "How are you feeling right now?", value: 6 },
  { question: "How stressed do you feel?", value: 6 },
  { question: "How energetic do you feel?", value: 6 },
];

function snapToStep(value: number) {
  return MOOD_STEPS.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev,
  );
}

export function MoodCheckForm({
  questions = DEFAULT_QUESTIONS,
  onSubmit,
  isSubmitting = false,
  title = "How are you feeling?",
  subtitle = "Take a moment to reflect and log your current mood.",
  submitLabel = "Save Mood",
  defaultMoodValue,
}: MoodCheckFormProps) {
  /* Only seed q_0 when the caller explicitly passes a defaultMoodValue (i.e. user
   * tapped a mood chip on the home screen). All other questions — and q_0 itself
   * when no value is passed — start empty so nothing is pre-selected. */
  const [answers, setAnswers] = useState<Record<string, number | undefined>>(() => {
    if (defaultMoodValue != null) {
      return { q_0: snapToStep(defaultMoodValue).value };
    }
    return {};
  });

  const handleSelect = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    /* Strip undefined entries before handing to parent — state allows undefined
     * so nothing is pre-selected, but onSubmit contract requires number values. */
    const defined = Object.fromEntries(
      Object.entries(answers).filter((entry): entry is [string, number] => entry[1] !== undefined),
    );
    await onSubmit(defined);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Hero card */}
      <Card className="relative w-full overflow-hidden border-0 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600" />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/5" />
        <div className="relative p-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            <Sparkles className="w-3 h-3" />
            Daily check-in
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm text-white/85">{subtitle}</p>
        </div>
      </Card>

      {/* Questions — one grouped card */}
      <Card>
        <CardContent className="py-0 px-3">
          {questions.map((q, i) => {
            const key = `q_${i}`;
            const val = answers[key];
            const selected = val != null ? snapToStep(val) : null;
            const isLast = i === questions.length - 1;

            return (
              <div key={key} className={cn("py-4", !isLast && "border-b border-border")}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-medium text-foreground flex-1 min-w-0">{q.question}</p>
                  {selected && (
                    <span
                      className={cn(
                        "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white bg-gradient-to-br",
                        selected.gradient,
                      )}
                    >
                      {selected.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1.5">
                  {MOOD_STEPS.map((step) => {
                    const isSelected = step.value === val;
                    return (
                      <button
                        key={step.value}
                        type="button"
                        onClick={() => handleSelect(key, step.value)}
                        aria-label={step.label}
                        aria-pressed={isSelected}
                        className={cn(
                          "relative flex-1 aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95",
                          isSelected
                            ? cn("bg-gradient-to-br shadow-md", step.gradient)
                            : "bg-muted hover:bg-muted/70",
                        )}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                            <Check className="w-3 h-3 text-foreground" strokeWidth={3} />
                          </div>
                        )}
                        <span
                          className={cn(
                            "text-2xl transition-transform",
                            isSelected ? "scale-110" : "opacity-70",
                          )}
                        >
                          {step.emoji}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button className="w-full rounded-xl h-11" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
