/**
 * FILE: components/auth/phone-step.tsx
 *
 * PURPOSE:
 *   Step 1 of the login flow — renders the heading, country-code selector,
 *   10-digit phone input, Continue and Sign Up buttons, and the Terms/Privacy footer.
 *
 * LOGIC OVERVIEW:
 *   Receives a react-hook-form Controller render prop pattern via `control` and
 *   surfaces the country picker trigger. Strips non-digit characters from input
 *   and enforces a 10-character cap. The parent handles OTP submission.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   PhoneStepProps  — prop interface
 *   control         — RHF Control for the phone field
 *   country         — selected Country object
 *   isSendingOtp    — disables Continue while the OTP request is in-flight
 *   onOpenPicker    — triggers the country picker dialog
 *   onSubmit        — RHF handleSubmit-wrapped submission handler
 *   onSignUp        — navigates to the signup route
 *
 * DEPENDENCIES:
 *   react-hook-form — Controller
 *   lucide-react    — ChevronDown
 *   next/link       — Terms / Privacy links
 *   country-picker-dialog — Country type + flag helper
 *
 * LAST UPDATED: 2026-05-07 — extracted from login/page.tsx; 10-digit enforcement; typed Control
 */

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { Country } from "@/components/auth/country-picker-dialog";
import { flag } from "@/components/auth/country-picker-dialog";

interface PhoneStepProps {
  control: Control<{ phone: string }>;
  country: Country | null;
  isSendingOtp: boolean;
  onOpenPicker: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onSignUp: () => void;
}

export function PhoneStep({
  control,
  country,
  isSendingOtp,
  onOpenPicker,
  onSubmit,
  onSignUp,
}: PhoneStepProps) {
  return (
    <>
      <h1 className="text-[26px] font-bold text-gray-900 mt-8 mb-2">Start your journey</h1>
      <p className="text-[14px] text-gray-400 mb-8 leading-relaxed">
        Enter your mobile number to sign in or create a new account.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2 h-13">
                {/* Country code selector */}
                <button
                  type="button"
                  onClick={onOpenPicker}
                  className="flex items-center gap-1.5 px-3 rounded-2xl bg-white text-sm font-medium text-gray-700 shrink-0 hover:bg-gray-200 transition-colors"
                >
                  <span className="text-xl leading-none">
                    {country ? flag(country.countryCode) : "🌐"}
                  </span>
                  <span>+{country?.callingCode ?? "91"}</span>
                  <ChevronDown className="size-3.5 text-gray-400" />
                </button>

                {/*
                 * Phone number input — digits only, max 10.
                 * name="tel" + autocomplete="tel-national" lets browsers and password
                 * managers autofill saved phone numbers. autoFocus opens the keyboard
                 * immediately so the user can start typing without a tap.
                 * Non-digit characters are stripped on every keystroke.
                 */}
                <input
                  type="tel"
                  inputMode="numeric"
                  name="tel"
                  autoComplete="tel-national"
                  autoFocus
                  maxLength={10}
                  value={field.value}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                    field.onChange(digitsOnly);
                  }}
                  placeholder="10-digit mobile number"
                  className="flex-1 rounded-2xl bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-300 transition"
                />
              </div>
              {fieldState.error && (
                <p className="text-xs text-red-500 ml-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <button
          type="submit"
          disabled={isSendingOtp}
          className="h-14 rounded-2xl text-white font-semibold text-[16px] mt-1 transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #e05c3a, #f5894a)" }}
        >
          {isSendingOtp ? "Sending…" : "Continue"}
        </button>
      </form>

      <button
        type="button"
        onClick={onSignUp}
        className="mt-3 h-14 rounded-2xl bg-white border text-gray-700 font-semibold text-[16px] transition-colors hover:bg-gray-200"
      >
        Sign up
      </button>

      <p className="mt-auto pt-10 text-[12px] text-gray-400 text-center leading-relaxed">
        By continuing, you agree to our{" "}
        <Link href="/term-and-condition" className="text-orange-500 font-medium">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-orange-500 font-medium">
          Privacy Policy
        </Link>
      </p>
    </>
  );
}
