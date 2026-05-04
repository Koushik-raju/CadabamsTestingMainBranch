/**
 * FILE: app/(public)/auth/signup/step-feeling.tsx
 *
 * PURPOSE:
 *   Asks how the user has been feeling overall this past week. Single-select with
 *   5 emoji-backed options. Auto-advances 600 ms after selection for low friction.
 *
 * LOGIC OVERVIEW:
 *   Tapping a card: updates context + sets a 600 ms timer that calls goNext.
 *   A "Continue" button appears immediately after selection as a manual override.
 *   timerRef is cleared on unmount and on each new selection to avoid double-advance.
 *   If the user navigates back to this step, the previously saved feeling is pre-selected
 *   and a Continue button is immediately visible (no auto-advance on remount).
 *
 * DEPENDENCIES: useSignupContext, FEELING_OPTIONS, coralGrad
 *
 * LAST UPDATED: 2026-05-04 — fix useRef missing initialValue TS error
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useSignupContext } from "./context";
import { FEELING_OPTIONS, coralGrad } from "./types";

export function StepFeeling() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();
  const [selected, setSelected] = useState(data.overallFeeling);
  /* true only after the user taps in THIS render — prevents auto-advance on back-navigation */
  const [justSelected, setJustSelected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSelect = (value: string) => {
    clearTimeout(timerRef.current);
    setSelected(value);
    updateData({ overallFeeling: value });
    setJustSelected(true);
  };

  useEffect(() => {
    if (!justSelected) return;
    timerRef.current = setTimeout(() => goNext(), 600);
    return () => clearTimeout(timerRef.current);
  }, [justSelected, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-6">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[26px] font-black text-foreground leading-tight">
          How have you been feeling overall this past week?
        </h1>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {FEELING_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
                isSelected ? "shadow-md" : "border-border bg-white"
              }`}
              style={
                isSelected
                  ? { borderColor: opt.color, backgroundColor: opt.color + "18" }
                  : undefined
              }
            >
              <span
                className={`text-3xl transition-transform duration-200 select-none ${isSelected ? "scale-125" : ""}`}
              >
                {opt.emoji}
              </span>
              <span
                className={`text-[16px] font-semibold flex-1 ${
                  isSelected ? "text-foreground" : "text-foreground/65"
                }`}
              >
                {opt.label}
              </span>
              {isSelected && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: opt.color }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <button
          type="button"
          onClick={() => {
            clearTimeout(timerRef.current);
            goNext();
          }}
          className="h-14 rounded-2xl text-white font-semibold text-[16px] mt-4 transition-opacity"
          style={coralGrad}
        >
          Continue
        </button>
      )}
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
