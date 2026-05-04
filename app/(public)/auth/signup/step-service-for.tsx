/**
 * FILE: app/(public)/auth/signup/step-service-for.tsx
 *
 * PURPOSE:
 *   First onboarding step — asks "Who are you seeking help for?" with two
 *   tappable cards (Myself / Someone Else). Selecting a card advances the step.
 *
 * LOGIC OVERVIEW:
 *   Reads updateData and setStep from context. Tapping "Myself" sets
 *   serviceForSelf=true and jumps to date-of-birth. Tapping "Someone Else"
 *   sets serviceForSelf=false and advances to patient-form.
 *   Progress bar is rendered inline (hero has no compact header above it).
 *
 * DEPENDENCIES: useSignupContext, lucide-react, next/link
 *
 * LAST UPDATED: 2026-05-04 — initial extraction
 */

"use client";

import { User, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSignupContext } from "./context";

export function StepServiceFor() {
  const { updateData, setStep, visibleSteps, currentIndex } = useSignupContext();

  return (
    <div className="flex flex-col flex-1 gap-5">
      {/* Progress bar — lives inside body since the hero sits above */}
      <div className="flex gap-1.5 pt-2">
        {visibleSteps.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              i <= currentIndex ? "bg-primary" : "bg-black/10",
            )}
          />
        ))}
      </div>

      <div>
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Welcome to Cadabams
        </p>
        <h1 className="text-[30px] font-black text-foreground leading-tight">
          Who are you seeking help for?
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
          We&apos;ll personalise your experience based on your answer.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {(
          [
            {
              label: "Myself",
              desc: "Access therapy and wellness tools for your personal journey",
              icon: User,
              self: true,
            },
            {
              label: "Someone Else",
              desc: "Book care for a family member or loved one",
              icon: Users,
              self: false,
            },
          ] as const
        ).map(({ label, desc, icon: Icon, self }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              updateData({ serviceForSelf: self });
              setStep(self ? "date-of-birth" : "patient-form");
            }}
            className="w-full text-left bg-card rounded-2xl border-2 p-5 flex items-start gap-4 transition-all active:scale-[0.98] shadow-[var(--sh-1)] border-transparent hover:border-primary/30"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-[16px] font-bold text-foreground">{label}</p>
              <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-auto pt-4 text-[13px] text-gray-400 text-center">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-orange-500 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
