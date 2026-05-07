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
 *   Web OTP API: attempts to read the SMS code silently on mount (Android Chrome /
 *   iOS 18+ Safari). AbortController is cleaned up on unmount.
 *
 * DEPENDENCIES: useSignupContext, OTPInput component, coralGrad from ./types
 *
 * LAST UPDATED: 2026-05-07 — Web OTP API + autoFocusFirst
 */

"use client";

import { useEffect, useRef } from "react";
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

  const abortRef = useRef<AbortController | null>(null);

  /*
   * Web OTP API — silently reads the SMS code on Android Chrome and iOS 18+ Safari.
   * The SMS body must include "@<origin> #<code>" for the browser to extract it.
   * Falls through silently on unsupported browsers or when the user dismisses.
   */
  useEffect(() => {
    if (!("OTPCredential" in window)) return;

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal } as CredentialRequestOptions)
      .then((credential) => {
        if (credential && "code" in credential) {
          setOtp((credential as { code: string }).code);
        }
      })
      .catch(() => {});

    return () => {
      abortRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      <OTPInput value={otp} onChange={setOtp} autoFocusFirst />

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
