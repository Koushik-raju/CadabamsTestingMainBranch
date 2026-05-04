/**
 * FILE: app/(public)/auth/signup/step-signup-otp.tsx
 *
 * PURPOSE:
 *   OTP verification step. Shows the submitted phone number and an OTP input
 *   that auto-verifies when 4 digits are entered.
 *
 * LOGIC OVERVIEW:
 *   Reads otp, timer, submittedPhone, country, isVerifying from context.
 *   Auto-verify is wired in context (useEffect on otp.length === 4).
 *   Manual "Verify" button calls context.handleSignup(otp).
 *   Resend button (visible after 30 s timer expires) calls context.handleResendOtp().
 *
 * DEPENDENCIES: useSignupContext, OTPInput component, coralGrad from ./types
 *
 * LAST UPDATED: 2026-05-04 — initial extraction
 */

"use client";

import { OTPInput } from "@/components/common/otp-input";
import { useSignupContext } from "./context";
import { coralGrad } from "./types";

export function StepSignupOtp() {
  const {
    otp,
    setOtp,
    timer,
    submittedPhone,
    country,
    isVerifying,
    handleSignup,
    handleResendOtp,
  } = useSignupContext();

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-8">
        <h1 className="text-[26px] font-bold text-gray-900 mb-2">Verify your number</h1>
        <p className="text-[14px] text-gray-400">
          Sent to{" "}
          <span className="font-medium text-gray-700">
            +{country?.callingCode ?? "91"} {submittedPhone}
          </span>
        </p>
      </div>

      <OTPInput value={otp} onChange={setOtp} />

      <button
        type="button"
        disabled={isVerifying || otp.length < 4}
        onClick={() => handleSignup(otp)}
        className="h-14 rounded-2xl text-white font-semibold text-[16px] mt-6 transition-opacity disabled:opacity-60"
        style={coralGrad}
      >
        {isVerifying ? "Verifying…" : "Verify & Create Account"}
      </button>

      <div className="mt-4 text-center">
        {timer > 0 ? (
          <p className="text-sm text-gray-400">
            Resend in <span className="tabular-nums font-medium text-gray-700">{timer}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
          >
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}
