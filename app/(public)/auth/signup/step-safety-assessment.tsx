/**
 * FILE: app/(public)/auth/signup/step-safety-assessment.tsx
 *
 * PURPOSE:
 *   Safety & risk assessment with 4 questions:
 *   2 frequency-based (hopelessness, self-harm) open a bottom sheet with options;
 *   2 yes/no (medication, chronic pain) stay as inline pill buttons.
 *
 * LOGIC OVERVIEW:
 *   activeQuestion controls which frequency question's bottom sheet is open.
 *   Tapping a frequency row sets activeQuestion; selecting an option writes to context
 *   and closes the sheet. Yes/no questions write directly on tap.
 *   Continue is enabled once all 4 are answered.
 *
 * DEPENDENCIES: useSignupContext, SAFETY_FREQ_OPTIONS, shadcn Sheet, lucide-react
 *
 * LAST UPDATED: 2026-05-04 — frequency question options moved to bottom sheet
 */

"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const allAnswered =
    FREQ_QUESTIONS.every(({ key }) => !!data[key]) &&
    YES_NO_QUESTIONS.every(({ key }) => !!data[key]);

  const activeLabel = FREQ_QUESTIONS.find((q) => q.key === activeQuestion)?.label;

  const handleFreqSelect = (opt: string) => {
    if (activeQuestion) {
      updateData({ [activeQuestion]: opt });
      setActiveQuestion(null);
    }
  };

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

      <div className="flex flex-col gap-3">
        {/* Frequency questions — tap to open bottom sheet */}
        {FREQ_QUESTIONS.map(({ key, label }) => {
          const selected = data[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveQuestion(key)}
              className="w-full bg-white rounded-2xl border border-border p-4 text-left active:scale-[0.98] transition-all"
            >
              <p className="text-[13px] font-semibold text-foreground mb-2 leading-snug">{label}</p>
              <div
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${
                  selected ? "border-primary bg-primary/10" : "border-border bg-background"
                }`}
              >
                <span
                  className={`text-[13px] leading-snug flex-1 ${
                    selected ? "font-semibold text-primary" : "text-muted-foreground"
                  }`}
                >
                  {selected || "Select an answer"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-colors ${selected ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
            </button>
          );
        })}

        {/* Yes / No questions — inline pill buttons */}
        {YES_NO_QUESTIONS.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-[13px] font-semibold text-foreground mb-3 leading-snug">{label}</p>
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

      {/* Bottom sheet for frequency options */}
      <Sheet open={!!activeQuestion} onOpenChange={(open) => !open && setActiveQuestion(null)}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-3xl pb-8">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-[15px] font-bold text-foreground leading-snug">
              {activeLabel}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            {SAFETY_FREQ_OPTIONS.map((opt) => {
              const isSelected = activeQuestion
                ? data[activeQuestion as keyof typeof data] === opt
                : false;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleFreqSelect(opt)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-white"
                  }`}
                >
                  <div
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span
                    className={`text-[13.5px] leading-snug flex-1 ${
                      isSelected ? "font-semibold text-primary" : "text-foreground/75"
                    }`}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
