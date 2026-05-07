/**
 * FILE: app/(public)/auth/signup/page.tsx
 *
 * PURPOSE:
 *   Shell page for the unified onboarding + signup flow. Renders the layout
 *   (hero image on the first step, compact progress header on all others) and
 *   delegates all logic and state to SignupContext.
 *
 * LOGIC OVERVIEW:
 *   SignupPage wraps everything in Suspense (required because SignupProvider calls
 *   useSearchParams). SignupLayout reads `step` from context to decide which header
 *   and which step component to render. The back arrow is integrated inline with the
 *   progress bar — a small circular icon button on the left.
 *
 * KEY EXPORTS:
 *   SignupPage — default export; Suspense + SignupProvider wrapper
 *
 * DEPENDENCIES:
 *   SignupProvider / useSignupContext — context.tsx
 *   Step components — step-*.tsx
 *   CountryPicker — country-picker.tsx
 *   next/image, shadcn Skeleton, lucide-react ArrowLeft
 *
 * LAST UPDATED: 2026-05-07 — visualViewport scroll-into-view listener added to SignupLayout
 */

"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Suspense, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useKeyboardPadding } from "@/hooks/use-keyboard-padding";
import { cn } from "@/lib/utils";
import { SignupProvider, useSignupContext } from "./context";
import { CountryPicker } from "./country-picker";
import { StepAgeGender } from "./step-age-gender";
import { StepAssistance } from "./step-assistance";
import { StepCalmDown } from "./step-calm-down";
import { StepClinicalCheck } from "./step-clinical-check";
import { StepDateOfBirth } from "./step-date-of-birth";
import { StepFeeling } from "./step-feeling";
import { StepPatientForm } from "./step-patient-form";
import { StepSafetyAssessment } from "./step-safety-assessment";
import { StepServiceFor } from "./step-service-for";
import { StepSignupForm } from "./step-signup-form";
import { StepSignupOtp } from "./step-signup-otp";
import { StepStressLevel } from "./step-stress-level";
import { StepStruggles } from "./step-struggles";
import { StepSupportSystem } from "./step-support-system";
import { StepThanksCheckIn } from "./step-thanks-check-in";

// ─── Layout shell ─────────────────────────────────────────────────────────────

function SignupLayout() {
  const { step, visibleSteps, currentIndex, isFirst, goBack } = useSignupContext();
  const bottomPadding = useKeyboardPadding();

  /*
   * Scroll focused input into view whenever the soft keyboard opens/resizes.
   * visualViewport "resize" fires as the keyboard appears — we then scroll the
   * active element to centre it above the keyboard edge.
   */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const scrollFocused = () => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    vv.addEventListener("resize", scrollFocused);
    return () => vv.removeEventListener("resize", scrollFocused);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Hero (first step only) ────────────────────────────────────── */}
      {step === "service-for" ? (
        <div className="relative h-72 shrink-0 overflow-hidden">
          <Image
            src="/assets/auth/auth-bg.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-linear-to-t from-background to-transparent" />
          <div
            className="absolute bottom-8 left-6 w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #e06050, #f4a07a)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3 L13.8 8.8 H20 L14.7 12.4 L16.5 18.2 L12 14.8 L7.5 18.2 L9.3 12.4 L4 8.8 H10.2 Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      ) : (
        /* ── Compact progress header — back arrow inline with progress bar ── */
        <div className="px-5 pt-12 pb-4">
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Go back"
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
            )}
            <div className="flex gap-1.5 flex-1">
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
          </div>
        </div>
      )}

      {/* ── Step content ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-1 px-5 overflow-y-auto"
        style={{ paddingBottom: bottomPadding }}
      >
        {step === "service-for" && <StepServiceFor />}
        {step === "patient-form" && <StepPatientForm />}
        {step === "date-of-birth" && <StepDateOfBirth />}
        {step === "age-gender" && <StepAgeGender />}
        {step === "feeling" && <StepFeeling />}
        {step === "struggles" && <StepStruggles />}
        {step === "calm-down" && <StepCalmDown />}
        {step === "assistance-selection" && <StepAssistance />}
        {step === "support-system" && <StepSupportSystem />}
        {step === "stress-level" && <StepStressLevel />}
        {step === "clinical-check" && <StepClinicalCheck />}
        {step === "thanks-check-in" && <StepThanksCheckIn />}
        {step === "safety-assessment" && <StepSafetyAssessment />}
        {step === "signup-form" && <StepSignupForm />}
        {step === "signup-otp" && <StepSignupOtp />}
      </div>

      <CountryPicker />
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

function SignupFlow() {
  return (
    <SignupProvider>
      <SignupLayout />
    </SignupProvider>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Skeleton className="h-80 w-full max-w-sm rounded-3xl mx-6" />
        </div>
      }
    >
      <SignupFlow />
    </Suspense>
  );
}
