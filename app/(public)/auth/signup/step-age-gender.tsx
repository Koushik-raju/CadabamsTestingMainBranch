/**
 * FILE: app/(public)/auth/signup/step-age-gender.tsx
 *
 * PURPOSE:
 *   Collects age (via +/- stepper) and gender (pill chips).
 *
 * LOGIC OVERVIEW:
 *   Local age string mirrors context data.age for immediate input feedback.
 *   +/- buttons clamp between 13 and 100. Direct number input is also supported.
 *   Gender selection writes straight to context via updateData.
 *   Continue is enabled once both are filled; a barely-visible "Skip for now" sits below.
 *
 * DEPENDENCIES: useSignupContext, lucide-react Minus/Plus, coralGrad/coralBtnCls/GENDER_OPTIONS
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useSignupContext } from "./context";
import { GENDER_OPTIONS, coralBtnCls, coralGrad } from "./types";

export function StepAgeGender() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();
  const [ageStr, setAgeStr] = useState(data.age || "");

  const age = parseInt(ageStr) || 0;
  const canContinue = age >= 13 && age <= 100 && !!data.gender;

  const setAge = (v: number) => {
    const clamped = Math.min(100, Math.max(13, v));
    setAgeStr(String(clamped));
    updateData({ age: String(clamped) });
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-6">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[30px] font-black text-foreground leading-tight">A bit about you</h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Helps us match the right support for your stage of life
        </p>
      </div>

      {/* Age */}
      <div className="mb-7">
        <p className="text-[15px] font-semibold text-foreground mb-4">How old are you?</p>
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => age > 13 && setAge(age - 1)}
            className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center active:scale-95 transition-all hover:bg-black/10"
          >
            <Minus className="w-5 h-5 text-foreground" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            value={ageStr}
            onChange={(e) => {
              setAgeStr(e.target.value);
              const n = parseInt(e.target.value);
              if (!isNaN(n)) updateData({ age: e.target.value });
            }}
            placeholder="--"
            className="w-28 h-20 rounded-2xl bg-white text-center text-[40px] font-black text-foreground outline-none focus:ring-2 focus:ring-orange-300 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => age < 100 && setAge(age + 1)}
            className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center active:scale-95 transition-all hover:bg-black/10"
          >
            <Plus className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Gender */}
      <div className="mb-6">
        <p className="text-[15px] font-semibold text-foreground mb-4">Gender</p>
        <div className="grid grid-cols-2 gap-2.5">
          {GENDER_OPTIONS.map((g) => {
            const selected = data.gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => updateData({ gender: g })}
                className={`h-12 rounded-2xl text-[14px] font-medium border-2 transition-all active:scale-[0.97] ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-white text-foreground/70"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
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
