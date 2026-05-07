/**
 * FILE: components/auth/otp-step.tsx
 *
 * PURPOSE:
 *   Step 2 of the login flow — OTP entry screen with back navigation,
 *   4-digit OTPInput, Verify button, and a 30-second resend countdown.
 *
 * LOGIC OVERVIEW:
 *   Web OTP API: on mount, attempts navigator.credentials.get({ otp: { transport:['sms'] } })
 *   which silently reads the incoming SMS OTP on Android Chrome and iOS 18+ Safari. The
 *   AbortController is cancelled when the component unmounts or the user navigates back.
 *   autoFocusFirst on OTPInput ensures the keyboard opens immediately on step transition.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   OtpStepProps  — prop interface
 *   otp           — controlled 4-digit string
 *   onChange      — called on every OTPInput change
 *   timer         — countdown seconds; >0 shows "Resend in Xs", 0 shows Resend button
 *   isVerifying   — disables Verify button while in-flight
 *   callingCode   — country calling code shown next to the phone number
 *   phone         — the phone number entered in step 1
 *   onBack        — navigates back to the phone step
 *   onVerify      — called when user taps Verify & Sign In
 *   onResend      — called when user taps Resend OTP
 *
 * DEPENDENCIES:
 *   OTPInput         — components/common/otp-input
 *   lucide-react     — ArrowLeft
 *   Web OTP API      — navigator.credentials.get for automatic SMS reading
 *
 * LAST UPDATED: 2026-05-07 — added Web OTP API auto-read + autoFocusFirst
 */

import { ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { OTPInput } from "@/components/common/otp-input";

interface OtpStepProps {
  otp: string;
  onChange: (value: string) => void;
  timer: number;
  isVerifying: boolean;
  callingCode: string;
  phone: string;
  onBack: () => void;
  onVerify: () => void;
  onResend: () => void;
}

export function OtpStep({
  otp,
  onChange,
  timer,
  isVerifying,
  callingCode,
  phone,
  onBack,
  onVerify,
  onResend,
}: OtpStepProps) {
  const abortRef = useRef<AbortController | null>(null);

  /*
   * Web OTP API — reads the SMS silently on Android Chrome and iOS 18+ Safari.
   * The SMS body must include "@<origin> #<code>" for the browser to extract it.
   * We abort on unmount so we don't leak the listener when the user goes back.
   * Silently ignores unsupported browsers and user-dismissed prompts.
   */
  useEffect(() => {
    if (!("OTPCredential" in window)) return;

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal } as CredentialRequestOptions)
      .then((credential) => {
        if (credential && "code" in credential) {
          onChange((credential as { code: string }).code);
        }
      })
      .catch(() => {
        // user dismissed, unsupported, or aborted — fall through to manual entry
      });

    return () => {
      abortRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        type="button"
        onClick={() => {
          abortRef.current?.abort();
          onBack();
        }}
        className="flex items-center gap-1.5 mt-6 mb-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Change number
      </button>

      <h1 className="text-[26px] font-bold text-gray-900 mb-2">Enter the code</h1>
      <p className="text-[14px] text-gray-400 mb-8">
        Sent to{" "}
        <span className="font-medium text-gray-700">
          +{callingCode} {phone}
        </span>
      </p>

      <OTPInput value={otp} onChange={onChange} autoFocusFirst />

      <button
        type="button"
        disabled={isVerifying || otp.length < 4}
        onClick={onVerify}
        className="h-14 rounded-2xl text-white font-semibold text-[16px] mt-6 transition-opacity disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #e05c3a, #f5894a)" }}
      >
        {isVerifying ? "Verifying…" : "Verify & Sign In"}
      </button>

      <div className="mt-4 text-center">
        {timer > 0 ? (
          <p className="text-sm text-gray-400">
            Resend in <span className="tabular-nums font-medium text-gray-700">{timer}s</span>
          </p>
        ) : (
          <button
            type="button"
            className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
            onClick={onResend}
          >
            Resend OTP
          </button>
        )}
      </div>
    </>
  );
}
