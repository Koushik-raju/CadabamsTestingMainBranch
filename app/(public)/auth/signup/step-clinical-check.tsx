/**
 * FILE: app/(public)/auth/signup/step-clinical-check.tsx
 *
 * PURPOSE:
 *   Shows 3 clinical frequency questions. Each question shows the current selection
 *   (or a placeholder) and opens a bottom sheet with the 5 frequency options on tap.
 *
 * LOGIC OVERVIEW:
 *   activeQuestion tracks which question key currently has the bottom sheet open.
 *   Tapping a question row sets activeQuestion; picking an option writes to context
 *   and closes the sheet. Continue is enabled once all 3 are answered.
 *
 * DEPENDENCIES: useSignupContext, CLINICAL_FREQ_OPTIONS, shadcn Sheet, lucide-react ChevronDown
 *
 * LAST UPDATED: 2026-05-04 — MCQ options moved to bottom sheet
 */

"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSignupContext } from "./context";
import { CLINICAL_FREQ_OPTIONS, coralBtnCls, coralGrad, type OnboardingData } from "./types";

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
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const allAnswered = CLINICAL_QUESTIONS.every(({ key }) => !!data[key]);

  const activeLabel = CLINICAL_QUESTIONS.find((q) => q.key === activeQuestion)?.label;

  const handleSelect = (opt: string) => {
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
          In the past 2 weeks…
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          How often have you experienced the following?
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {CLINICAL_QUESTIONS.map(({ key, label }) => {
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
            {CLINICAL_FREQ_OPTIONS.map((opt) => {
              const isSelected = activeQuestion
                ? data[activeQuestion as keyof typeof data] === opt
                : false;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
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
