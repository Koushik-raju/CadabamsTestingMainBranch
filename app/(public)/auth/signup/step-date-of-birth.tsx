/**
 * FILE: app/(public)/auth/signup/step-date-of-birth.tsx
 *
 * PURPOSE:
 *   Collects the patient's date of birth using the custom DOBPicker component
 *   instead of a native <input type="date">.
 *
 * LOGIC OVERVIEW:
 *   Reads data.dob from context and writes back via updateData. Passes value/onChange
 *   to DOBPicker which assembles the ISO date string when all three selects are filled.
 *   Continue button is disabled until a valid dob is set.
 *
 * DEPENDENCIES: useSignupContext, DOBPicker, coralGrad / coralBtnCls from ./types
 *
 * LAST UPDATED: 2026-05-04 — initial extraction; uses custom DOBPicker
 */

"use client";

import { useSignupContext } from "./context";
import { DOBPicker } from "./dob-picker";
import { coralBtnCls, coralGrad } from "./types";

export function StepDateOfBirth() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div className="pt-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[30px] font-black text-foreground leading-tight">
          When were you born?
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Helps us personalise your care experience
        </p>
      </div>

      <DOBPicker value={data.dob} onChange={(iso) => updateData({ dob: iso })} />

      <button
        type="button"
        onClick={goNext}
        disabled={!data.dob}
        className={coralBtnCls}
        style={coralGrad}
      >
        Continue
      </button>
    </div>
  );
}
