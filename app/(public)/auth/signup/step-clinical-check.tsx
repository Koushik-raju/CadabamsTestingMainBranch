/**
 * FILE: app/(public)/auth/signup/step-clinical-check.tsx
 *
 * PURPOSE:
 *   Shows 3 clinical frequency questions on one scrollable page.
 *   Each question is a styled card with 5 single-select radio-style frequency options.
 *
 * LOGIC OVERVIEW:
 *   Three questions (motivation, anxiety, sleep) each map to a context data field.
 *   Continue is enabled once all 3 are answered; a faint "Skip for now" sits below.
 *   Answers write directly to context via updateData on each tap.
 *   The parent page container scrolls so all 3 cards are reachable.
 *
 * DEPENDENCIES: useSignupContext, CLINICAL_FREQ_OPTIONS, coralGrad/coralBtnCls
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { useSignupContext } from "./context";
import { CLINICAL_FREQ_OPTIONS, type OnboardingData, coralBtnCls, coralGrad } from "./types";

const CLINICAL_QUESTIONS: {
  key: keyof Pick<OnboardingData, "motivationFreq" | "anxietyFreq" | "sleepFreq">;
  label: string;
}[] = [
  { key: "motivationFreq", label: "Have low motivation and energy levels?" },
  { key: "anxietyFreq", label: "Feel anxious, nervous, or worried?" },
  { key: "sleepFreq", label: "Have trouble sleeping?" },
];

export function StepClinicalCheck() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();
  const allAnswered = CLINICAL_QUESTIONS.every(({ key }) => !!data[key]);

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-5">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[26px] font-black text-foreground leading-tight">
          In the past 2 weeks…
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          How often have you experienced the following?
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {CLINICAL_QUESTIONS.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-[14px] font-semibold text-foreground mb-3">{label}</p>
            <div className="flex flex-col gap-1.5">
              {CLINICAL_FREQ_OPTIONS.map((opt) => {
                const isSelected = data[key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateData({ [key]: opt })}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all active:scale-[0.98] text-left ${
                      isSelected ? "border-primary bg-primary/10" : "border-border bg-transparent"
                    }`}
                  >
                    <div
                      className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "border-primary" : "border-border"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span
                      className={`text-[12.5px] leading-snug ${
                        isSelected ? "font-semibold text-primary" : "text-foreground/70"
                      }`}
                    >
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!allAnswered}
        onClick={goNext}
        className={coralBtnCls}
        style={coralGrad}
      >
        Continue
      </button>
      <button
        type="button"
        onClick={goNext}
        className="mt-3 text-xs text-gray-300 self-center pb-1"
      >
        Skip for now
      </button>
    </div>
  );
}
