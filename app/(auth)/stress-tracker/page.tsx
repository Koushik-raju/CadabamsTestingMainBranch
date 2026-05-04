/**
 * FILE: app/(auth)/stress-tracker/page.tsx
 *
 * PURPOSE:
 *   Standalone Stress Tracker form. Two steps mirroring the legacy
 *   /stress-management/level + /selector flow:
 *     Q1 — pick stress level 1–5 (Very Low → Very High).
 *     Q2 — multi-select stressors (Work, Finance, Health, ...).
 *   Submits to POST /:campus/stress-tracker.
 *
 * LOGIC OVERVIEW:
 *   - Step 1: 5 stacked level cards (color-graded green→red) — taps select.
 *   - Step 2: chip multi-select using STRESS_REASONS.
 *   - Submit posts and routes to /stress-tracker/report.
 *
 * KEY VARIABLES / EXPORTS:
 *   StressTrackerPage — default export.
 *
 * DEPENDENCIES:
 *   useStressTracker, PageHeader, Button, Skeleton.
 *
 * LAST UPDATED: 2026-04-28 — initial creation.
 */
"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import {
  STRESS_LEVELS,
  STRESS_REASONS,
  submitStressEntry,
} from "@/hooks/stress-tracker/use-stress-tracker";

const LEVEL_TINTS: Record<number, { idle: string; active: string }> = {
  1: {
    idle: "bg-emerald-50 border-emerald-200",
    active: "bg-emerald-500 border-emerald-600 text-white",
  },
  2: { idle: "bg-lime-50 border-lime-200", active: "bg-lime-500 border-lime-600 text-white" },
  3: {
    idle: "bg-yellow-50 border-yellow-200",
    active: "bg-yellow-500 border-yellow-600 text-white",
  },
  4: {
    idle: "bg-orange-50 border-orange-200",
    active: "bg-orange-500 border-orange-600 text-white",
  },
  5: { idle: "bg-red-50 border-red-200", active: "bg-red-500 border-red-600 text-white" },
};

export default function StressTrackerPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const levelLabel = STRESS_LEVELS.find((l) => l.score === stressLevel)?.label;

  const toggleReason = (reason: string) => {
    setReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );
  };

  const handleSubmit = async () => {
    if (!stressLevel) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitStressEntry({
        stressLevel,
        stressLevelLabel: levelLabel,
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

      <div className="px-4 flex flex-col gap-6">
        <div className="flex items-center gap-2 pt-2">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-rose-500" : "bg-muted"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-rose-500" : "bg-muted"}`} />
        </div>

        {step === 1 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 px-1">
              <h2 className="text-xl font-bold leading-snug">What's your stress level today?</h2>
              <p className="text-sm text-muted-foreground">
                Pick the level that best matches how you feel right now.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {STRESS_LEVELS.map(({ score, label }) => {
                const selected = stressLevel === score;
                const tint = LEVEL_TINTS[score];
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setStressLevel(score)}
                    className={`flex items-center justify-between rounded-2xl border-2 p-4 transition active:scale-[0.98] ${
                      selected ? tint.active : tint.idle
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                          selected ? "bg-white/20 text-white" : "bg-white text-foreground"
                        }`}
                      >
                        {score}
                      </span>
                      <span className="text-base font-semibold">{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={stressLevel == null}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </section>
        )}

        {step === 2 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 px-1">
              <h2 className="text-xl font-bold leading-snug">Why are you stressed about?</h2>
              <p className="text-sm text-muted-foreground">Pick all that apply.</p>
            </div>

            <div className="flex flex-wrap gap-2 px-1">
              {STRESS_REASONS.map((reason) => {
                const selected = reasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => toggleReason(reason)}
                    className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition active:scale-95 ${
                      selected
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-border bg-card text-foreground hover:border-rose-300"
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-destructive px-1">{error}</p>}

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
                {isSubmitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
