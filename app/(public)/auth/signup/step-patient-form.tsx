/**
 * FILE: app/(public)/auth/signup/step-patient-form.tsx
 *
 * PURPOSE:
 *   Collects first name, last name, and relationship for a patient when the user
 *   is booking care for someone else.
 *
 * LOGIC OVERVIEW:
 *   Reads patientFirstName, patientLastName, relationship from context.data.
 *   Name fields use plain inputs styled to match the Banani design.
 *   Relationship is chosen from pill chips (RELATIONSHIPS constant).
 *   Continue button is disabled until first name and relationship are set.
 *
 * DEPENDENCIES: useSignupContext, RELATIONSHIPS / coralGrad / coralBtnCls from ./types
 *
 * LAST UPDATED: 2026-05-04 — initial extraction
 */

"use client";

import { cn } from "@/lib/utils";
import { useSignupContext } from "./context";
import { RELATIONSHIPS, coralBtnCls, coralGrad } from "./types";

export function StepPatientForm() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();

  const inputCls =
    "flex-1 h-13 rounded-2xl bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-300 transition";

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div className="pt-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[30px] font-black text-foreground leading-tight">
          Patient information
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Tell us about the person you&apos;re booking for
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name row */}
        <div className="flex gap-2">
          <input
            placeholder="First name *"
            autoComplete="given-name"
            value={data.patientFirstName}
            onChange={(e) => updateData({ patientFirstName: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="Last name"
            autoComplete="family-name"
            value={data.patientLastName}
            onChange={(e) => updateData({ patientLastName: e.target.value })}
            className={inputCls}
          />
        </div>

        {/* Relationship chips */}
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Relationship <span className="text-primary">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIPS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => updateData({ relationship: r })}
                className={cn(
                  "px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all active:scale-95",
                  data.relationship === r
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-foreground border-transparent shadow-[var(--sh-1)] hover:border-primary/40",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={goNext}
        disabled={!data.patientFirstName || !data.relationship}
        className={coralBtnCls}
        style={coralGrad}
      >
        Continue
      </button>
    </div>
  );
}
