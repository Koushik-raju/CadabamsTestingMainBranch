/**
 * FILE: app/(auth)/mood-tracker/page.tsx
 *
 * PURPOSE:
 *   Standalone Mood Tracker form. Mirrors the visual language of the existing
 *   /assessments/[id] flow by reusing SmileySelector (Q1) and DotChooser (Q2).
 *   Question content + options are pulled from CMS (assessment id sourced via
 *   useMoodTrackerAssessment) so the form stays in lockstep with the live
 *   `/assessments/avym73d4x6258t3ligurl56r` reference.
 *
 * LOGIC OVERVIEW:
 *   - Step 1: SmileySelector. Selected index (0..4) maps to moodScore 1..5
 *     and the corresponding CMS smiley label is stored as moodLabel.
 *   - Step 2: DotChooser with up to 5 slots. We strip the CMS option `value`
 *     so the chooser stores the label string — that gives us a readable
 *     report screen without a value→label lookup table.
 *   - Submit POSTs to /:campus/mood-tracker via submitMoodEntry, then routes
 *     to /mood-tracker/report.
 *   - MoodTrackerContent is wrapped in <Suspense> by the default export so
 *     useSearchParams() satisfies Next.js SSR/prerender requirements.
 *
 * KEY VARIABLES / EXPORTS:
 *   MoodTrackerPage — default export (Suspense wrapper).
 *   MoodTrackerContent — inner client component with all form logic.
 *
 * DEPENDENCIES:
 *   useMoodTrackerAssessment, submitMoodEntry, SmileySelector, DotChooser,
 *   PageHeader, Button, Skeleton, Textarea.
 *
 * LAST UPDATED: 2026-04-30 — wrap in Suspense to fix useSearchParams() prerender error.
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { SmileySelector } from "@/components/shared/questions/answer-selectors/smiley";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { submitMoodEntry, useMoodTrackerAssessment } from "@/hooks/mood-tracker/use-mood-tracker";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const MAX_FEELINGS = 5;

function MoodTrackerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { smileyQuestion, bubbleQuestion, isLoading } = useMoodTrackerAssessment();

  /* Pre-select a smiley if the home hero pill linked here with ?mood=<1-5>.
   * Mood 1-5 maps to SmileySelector's 0-4 index. Out-of-range or missing
   * values fall back to -1 (no selection required). */
  const initialSmileyIndex = useMemo(() => {
    const raw = searchParams.get("mood");
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n - 1 : -1;
  }, [searchParams]);

  const [step, setStep] = useState<1 | 2>(1);
  // SmileySelector contract: selected is a 0..4 index, defaults internally to 2.
  // -1 means "not yet picked" so we can require an explicit choice before continuing.
  const [smileyIndex, setSmileyIndex] = useState<number>(initialSmileyIndex);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Render bubble options directly as an always-visible chip grid. The CMS
  // value codes (e.g. "14405") are dropped on save — we keep just the label
  // so the report screen reads naturally without a code→label lookup.
  const bubbleOptions = useMemo(
    () => (bubbleQuestion?.options ?? []).map((o) => ({ id: o.id, label: o.label })),
    [bubbleQuestion],
  );

  /* Strip the "I'm feeling " preamble the CMS uses on each smiley label, so the
   * tiny chips under each emoji read "Depressed / Sad / Neutral / Happy /
   * Overjoyed" instead of full sentences that wrap to 3 lines. */
  const smileyLabels = useMemo(() => {
    const cleaned = (smileyQuestion?.smileys ?? []).map((s) => {
      const trimmed = s.replace(/^\s*i['’]m feeling\s*/i, "").trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    });
    return cleaned as [string?, string?, string?, string?, string?];
  }, [smileyQuestion]);

  /* CMS Q1 title is literally "Question 1" — override with a friendly prompt
   * unless the CMS gives something more descriptive. */
  const q1Title = useMemo(() => {
    const t = smileyQuestion?.title?.trim();
    if (!t || /^question\s*\d+$/i.test(t)) return "How are you feeling right now?";
    return t;
  }, [smileyQuestion]);

  const q2Title = useMemo(() => {
    const t = bubbleQuestion?.title?.trim();
    if (!t || /^question\s*\d+$/i.test(t))
      return "Choose up to 5 emotions that reflect your current state of mind.";
    return t;
  }, [bubbleQuestion]);

  const toggleFeeling = (label: string) => {
    setFeelings((prev) =>
      prev.includes(label)
        ? prev.filter((f) => f !== label)
        : [...prev, label].slice(0, MAX_FEELINGS),
    );
  };

  const handleSubmit = async () => {
    if (smileyIndex < 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitMoodEntry({
        moodScore: smileyIndex + 1,
        moodLabel: smileyLabels[smileyIndex] ?? undefined,
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

      <div className="px-4 flex flex-col gap-6">
        <div className="flex items-center gap-2 pt-2">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-violet-500" : "bg-muted"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-violet-500" : "bg-muted"}`} />
        </div>

        {step === 1 && (
          <section className="flex flex-col gap-5">
            <SmileySelector
              title={q1Title}
              subTitle={smileyQuestion?.subtitle ?? undefined}
              selected={smileyIndex}
              onSelect={(i) => setSmileyIndex(i)}
              labels={smileyLabels}
            />
            {smileyIndex >= 0 && smileyLabels[smileyIndex] && (
              <p className="text-center text-sm font-medium text-muted-foreground -mt-2">
                You selected{" "}
                <span className="text-violet-600 font-semibold">{smileyLabels[smileyIndex]}</span>
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={smileyIndex < 0}
              onClick={() => setStep(2)}
            >
              {smileyQuestion?.continueLabel ?? "Continue"}
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
                Selected {feelings.length} of {MAX_FEELINGS}
              </p>
            </div>

            {bubbleOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">
                No feeling options configured in CMS yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 px-1">
                {bubbleOptions.map((opt) => {
                  const selected = feelings.includes(opt.label);
                  const disabled = !selected && feelings.length >= MAX_FEELINGS;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleFeeling(opt.label)}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition active:scale-95 ${
                        selected
                          ? "border-violet-500 bg-violet-500 text-white"
                          : disabled
                            ? "border-border bg-muted text-muted-foreground opacity-50"
                            : "border-border bg-card text-foreground hover:border-violet-300"
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
                {isSubmitting ? "Saving…" : "Save mood"}
              </Button>
            </div>
          </section>
        )}
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
