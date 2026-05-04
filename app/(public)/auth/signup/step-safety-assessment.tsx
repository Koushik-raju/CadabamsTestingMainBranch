/**
 * FILE: app/(public)/auth/signup/step-safety-assessment.tsx
 *
 * PURPOSE:
 *   Safety & risk assessment with 4 questions:
 *   2 frequency-based (hopelessness, self-harm thoughts) + 2 yes/no (medication, chronic pain).
 *
 * LOGIC OVERVIEW:
 *   Frequency questions use SAFETY_FREQ_OPTIONS; yes/no questions render two pill buttons.
 *   Continue is enabled once all 4 are answered; a faint "Skip for now" link sits below.
 *   All answers write to context via updateData.
 *
 * DEPENDENCIES: useSignupContext, SAFETY_FREQ_OPTIONS, coralGrad/coralBtnCls
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { useSignupContext } from "./context";
import { coralBtnCls, coralGrad, type OnboardingData, SAFETY_FREQ_OPTIONS } from "./types";

const FREQ_QUESTIONS: {
  key: keyof Pick<OnboardingData, "hopelessnessFreq" | "selfHarmFreq">;
  label: string;
}[] = [
  {
    key: "hopelessnessFreq",
    label: "In the past 2 weeks, how often have you felt down, sad, or hopeless?",
  },
  {
    key: "selfHarmFreq",
    label:
      "In the past 2 weeks, have you had thoughts that you'd be better off dead or thoughts of hurting yourself?",
  },
];

const YES_NO_QUESTIONS: {
  key: keyof Pick<OnboardingData, "takingMedication" | "chronicPain">;
  label: string;
}[] = [
  { key: "takingMedication", label: "Are you taking prescribed medication?" },
  {
    key: "chronicPain",
    label: "Are you currently managing any Chronic Pain / Physical Discomfort?",
  },
];

export function StepSafetyAssessment() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();

  const allAnswered =
    FREQ_QUESTIONS.every(({ key }) => !!data[key]) &&
    YES_NO_QUESTIONS.every(({ key }) => !!data[key]);

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-5">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[26px] font-black text-foreground leading-tight">
          Safety &amp; Risk Assessment
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Your answers help us tailor the right level of support
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Frequency questions */}
        {FREQ_QUESTIONS.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-[14px] font-semibold text-foreground mb-3">{label}</p>
            <div className="flex flex-col gap-1.5">
              {SAFETY_FREQ_OPTIONS.map((opt) => {
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

        {/* Yes / No questions */}
        {YES_NO_QUESTIONS.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-[14px] font-semibold text-foreground mb-3">{label}</p>
            <div className="flex gap-2">
              {(["Yes", "No"] as const).map((opt) => {
                const isSelected = data[key] === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateData({ [key]: opt.toLowerCase() })}
                    className={`flex-1 h-11 rounded-2xl text-[14px] font-semibold border-2 transition-all active:scale-[0.97] ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-transparent text-foreground/70"
                    }`}
                  >
                    {opt}
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
