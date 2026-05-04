/**
 * FILE: app/(public)/auth/signup/step-support-system.tsx
 *
 * PURPOSE:
 *   Multiselect screen asking which description best fits the user's support system.
 *   Multiple options can be selected; at least one is required to enable Continue.
 *
 * LOGIC OVERVIEW:
 *   Reads data.supportSystem (string[]) from context; toggles entries via updateData.
 *   Each option is a full-width selectable card with a checkbox indicator.
 *   A barely-visible "Skip for now" link below the CTA allows bypassing.
 *
 * DEPENDENCIES: useSignupContext, SUPPORT_SYSTEM_OPTIONS, coralGrad/coralBtnCls
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { useSignupContext } from "./context";
import { SUPPORT_SYSTEM_OPTIONS, coralBtnCls, coralGrad } from "./types";

export function StepSupportSystem() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();
  const selected = data.supportSystem;

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    updateData({ supportSystem: next });
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-6">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[26px] font-black text-foreground leading-tight">
          Which of the following describes your support system?
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2">Select all that apply</p>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {SUPPORT_SYSTEM_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                isSelected ? "border-primary bg-primary/10" : "border-border bg-white"
              }`}
            >
              <div
                className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected ? "border-primary bg-primary" : "border-border bg-transparent"
                }`}
              >
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-[14px] font-medium leading-snug ${
                  isSelected ? "text-primary" : "text-foreground/75"
                }`}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={selected.length === 0}
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
