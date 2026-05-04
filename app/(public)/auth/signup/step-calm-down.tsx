/**
 * FILE: app/(public)/auth/signup/step-calm-down.tsx
 *
 * PURPOSE:
 *   Reassurance / trust screen shown after the user shares their struggles.
 *   No data collection — pure brand messaging before the deeper intake questions.
 *
 * LOGIC OVERVIEW:
 *   Static screen with the Cadabams brand message. Single "Continue" button calls goNext.
 *   Designed to reduce anxiety before clinical / safety questions that follow.
 *
 * DEPENDENCIES: useSignupContext, coralGrad
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { useSignupContext } from "./context";
import { coralGrad } from "./types";

export function StepCalmDown() {
  const { goNext } = useSignupContext();

  return (
    <div className="flex flex-col flex-1 items-center justify-between pt-6 pb-2">
      {/* Icon */}
      <div className="flex flex-col items-center gap-6 flex-1 justify-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #e06050, #f4a07a)" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3 L13.8 8.8 H20 L14.7 12.4 L16.5 18.2 L12 14.8 L7.5 18.2 L9.3 12.4 L4 8.8 H10.2 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="text-center px-2">
          <h1 className="text-[26px] font-black text-foreground leading-tight mb-4">
            At Cadabams Mindtalk, we can help turn down the noise!
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Mindtalk is backed by the Cadabams Group, with{" "}
            <span className="font-semibold text-foreground">30+ years of clinical excellence</span>.
            Your experience is built on protocols used by real clinicians.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex gap-3 flex-wrap justify-center">
          {["NABH Accredited", "10,000+ Patients", "HIPAA Compliant"].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-semibold"
            >
              {badge}
            </span>
          ))}
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
