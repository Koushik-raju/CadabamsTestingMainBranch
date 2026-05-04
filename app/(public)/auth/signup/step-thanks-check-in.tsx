/**
 * FILE: app/(public)/auth/signup/step-thanks-check-in.tsx
 *
 * PURPOSE:
 *   Emotional acknowledgement screen shown between the clinical check and the safety
 *   assessment. No data collection — a moment of positive reinforcement.
 *
 * LOGIC OVERVIEW:
 *   Static motivational screen. Single "Continue" button calls goNext.
 *   Gives the user a micro-break between the intake sections.
 *
 * DEPENDENCIES: useSignupContext, coralGrad
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { useSignupContext } from "./context";
import { coralGrad } from "./types";

export function StepThanksCheckIn() {
  const { goNext } = useSignupContext();

  return (
    <div className="flex flex-col flex-1 items-center justify-between pt-6 pb-2">
      <div className="flex flex-col items-center gap-6 flex-1 justify-center text-center px-2">
        {/* Animated pulse ring */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #e05c3a22, #f5894a22)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #e05c3a44, #f5894a44)" }}
            >
              <span className="text-4xl select-none">💚</span>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-[28px] font-black text-foreground leading-tight mb-4">
            Thanks for checking in!
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Whether you&apos;re feeling great or struggling, acknowledging your emotions is the{" "}
            <span className="font-semibold text-foreground">first step to rewiring your brain</span>{" "}
            for resilience &amp; growth.
          </p>
        </div>

        <div className="bg-primary/5 rounded-2xl px-5 py-4 w-full">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            We&apos;re almost done — just a couple more questions to personalise your care plan.
          </p>
        </div>
      </div>

      <div className="w-full">
        <button
          type="button"
          onClick={goNext}
          className="h-14 w-full rounded-2xl text-white font-semibold text-[16px] transition-opacity"
          style={coralGrad}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
