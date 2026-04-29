/**
 * FILE: app/(auth)/sleep-tracker/page.tsx
 *
 * PURPOSE:
 *   Standalone Sleep Tracker form. Mirrors the visual language of mood-tracker
 *   by reusing SmileySelector (Q1 = 1–5 sleep-quality scale) and a chip grid
 *   (Q2 = factors). Question content + options are pulled from CMS (assessment
 *   id sourced via useSleepTrackerAssessment) so the form stays in lockstep
 *   with the live `/assessments/qgyyj84i2uosz0fm8ymmstcj` reference.
 *
 * LOGIC OVERVIEW:
 *   - Step 1: SmileySelector. Selected index (0..4) maps to sleepScore 1..5
 *     and the corresponding CMS label is stored as sleepLabel.
 *   - Step 2: Chip grid with up to 5 slots. We keep the CMS option `label`
 *     so the report screen reads naturally without a value→label lookup.
 *   - Submit POSTs to /:campus/sleep-tracker via submitSleepEntry, then routes
 *     to /sleep-tracker/report.
 *
 * KEY VARIABLES / EXPORTS:
 *   SleepTrackerPage — default export.
 *
 * DEPENDENCIES:
 *   useSleepTrackerAssessment, submitSleepEntry, SmileySelector,
 *   PageHeader, Button, Skeleton.
 *
 * LAST UPDATED: 2026-04-29 — initial creation (cloned from mood-tracker page).
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { SmileySelector } from "@/components/shared/questions/answer-selectors/smiley";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  submitSleepEntry,
  useSleepTrackerAssessment,
} from "@/hooks/sleep-tracker/use-sleep-tracker";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const MAX_FACTORS = 5;

export default function SleepTrackerPage() {
  const router = useRouter();
  const { scoreQuestion, bubbleQuestion, isLoading } = useSleepTrackerAssessment();

  const [step, setStep] = useState<1 | 2>(1);
  // SmileySelector contract: selected is a 0..4 index, defaults internally to 2.
  // -1 means "not yet picked" so we can require an explicit choice before continuing.
  const [scoreIndex, setScoreIndex] = useState<number>(-1);
  const [factors, setFactors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Render bubble options directly as an always-visible chip grid. The CMS
  // value codes are dropped on save — we keep just the label so the report
  // screen reads naturally without a code→label lookup.
  const bubbleOptions = useMemo(
    () => (bubbleQuestion?.options ?? []).map((o) => ({ id: o.id, label: o.label })),
    [bubbleQuestion],
  );

  /* CMS may store labels with a "I slept " or similar preamble — strip it so
   * the chips read naturally ("Very poorly / Poorly / OK / Well / Very well"). */
  const scoreLabels = useMemo(() => {
    const cleaned = (scoreQuestion?.smileys ?? []).map((s) => {
      const trimmed = s.replace(/^\s*i\s+(slept|sleep)\s*/i, "").trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    });
    return cleaned as [string?, string?, string?, string?, string?];
  }, [scoreQuestion]);

  /* CMS Q1 title is often literally "Question 1" — override with a friendly
   * prompt unless the CMS gives something more descriptive. */
  const q1Title = useMemo(() => {
    const t = scoreQuestion?.title?.trim();
    if (!t || /^question\s*\d+$/i.test(t)) return "How well did you sleep last night?";
    return t;
  }, [scoreQuestion]);

  const q2Title = useMemo(() => {
    const t = bubbleQuestion?.title?.trim();
    if (!t || /^question\s*\d+$/i.test(t))
      return "Choose up to 5 factors that affected your sleep.";
    return t;
  }, [bubbleQuestion]);

  const toggleFactor = (label: string) => {
    setFactors((prev) =>
      prev.includes(label)
        ? prev.filter((f) => f !== label)
        : [...prev, label].slice(0, MAX_FACTORS),
    );
  };

  const handleSubmit = async () => {
    if (scoreIndex < 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitSleepEntry({
        sleepScore: scoreIndex + 1,
        sleepLabel: scoreLabels[scoreIndex] ?? undefined,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Sleep Tracker" fallback="/home" />
        <div className="px-4 flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
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

      <div className="px-4 flex flex-col gap-6">
        <div className="flex items-center gap-2 pt-2">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-indigo-500" : "bg-muted"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-indigo-500" : "bg-muted"}`} />
        </div>

        {step === 1 && (
          <section className="flex flex-col gap-5">
            <SmileySelector
              title={q1Title}
              subTitle={scoreQuestion?.subtitle ?? undefined}
              selected={scoreIndex}
              onSelect={(i) => setScoreIndex(i)}
              labels={scoreLabels}
            />
            {scoreIndex >= 0 && scoreLabels[scoreIndex] && (
              <p className="text-center text-sm font-medium text-muted-foreground -mt-2">
                You selected{" "}
                <span className="text-indigo-600 font-semibold">{scoreLabels[scoreIndex]}</span>
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={scoreIndex < 0}
              onClick={() => setStep(2)}
            >
              {scoreQuestion?.continueLabel ?? "Continue"}
            </Button>
          </section>
        )}

        {step === 2 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 px-1">
              <h2 className="text-xl font-bold leading-snug">{q2Title}</h2>
              {bubbleQuestion?.subtitle && (
                <p className="text-sm text-muted-foreground">{bubbleQuestion.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Selected {factors.length} of {MAX_FACTORS}
              </p>
            </div>

            {bubbleOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">
                No factor options configured in CMS yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 px-1">
                {bubbleOptions.map((opt) => {
                  const selected = factors.includes(opt.label);
                  const disabled = !selected && factors.length >= MAX_FACTORS;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleFactor(opt.label)}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition active:scale-95 ${
                        selected
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : disabled
                            ? "border-border bg-muted text-muted-foreground opacity-50"
                            : "border-border bg-card text-foreground hover:border-indigo-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {submitError && <p className="text-sm text-destructive px-1">{submitError}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button className="flex-1" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save sleep"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
