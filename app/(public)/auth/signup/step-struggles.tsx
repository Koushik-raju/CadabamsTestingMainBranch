/**
 * FILE: app/(public)/auth/signup/step-struggles.tsx
 *
 * PURPOSE:
 *   Short free-text field asking the user what they're primarily struggling with.
 *
 * LOGIC OVERVIEW:
 *   Textarea with a 200-char soft limit (shows counter at 150+).
 *   Continue is enabled as soon as any non-whitespace text is entered.
 *   Value syncs to context.data.struggles on every change.
 *   A tiny "Skip for now" link below the CTA allows skipping without friction.
 *
 * DEPENDENCIES: useSignupContext, coralGrad/coralBtnCls
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { useSignupContext } from "./context";
import { coralBtnCls, coralGrad } from "./types";

export function StepStruggles() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();
  const value = data.struggles;
  const canContinue = value.trim().length > 0;

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-6">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[26px] font-black text-foreground leading-tight">
          What&apos;s mainly on your mind?
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          In a few words, what&apos;s the main thing you&apos;re struggling with right now?
        </p>
      </div>

      <div className="relative flex-1 flex flex-col">
        <textarea
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= 200) updateData({ struggles: e.target.value });
          }}
          placeholder="e.g. work stress, relationship issues, feeling overwhelmed…"
          rows={5}
          className="w-full rounded-2xl bg-white px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-300 transition resize-none"
        />
        {value.length >= 150 && (
          <p className="text-[11px] text-gray-400 text-right mt-1">{value.length} / 200</p>
        )}
      </div>

      <button
        type="button"
        disabled={!canContinue}
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
