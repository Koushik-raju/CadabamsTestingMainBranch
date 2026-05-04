/**
 * FILE: app/(public)/auth/signup/step-signup-form.tsx
 *
 * PURPOSE:
 *   Collects first name, last name (optional), email (optional), and mobile number
 *   then triggers OTP dispatch via the context onSendOtp handler.
 *
 * LOGIC OVERVIEW:
 *   Manages its own react-hook-form + zod state for field validation.
 *   On valid submit, calls context.onSendOtp(data) which stores the submitted values
 *   in context and advances to signup-otp step.
 *   Phone field renders a country selector button (opens CountryPicker dialog) alongside
 *   the number input. mobileParam from context pre-fills the phone field on mount.
 *
 * DEPENDENCIES:
 *   useSignupContext, react-hook-form + zod, flag() from ./types
 *   shadcn/ui: none (bare inputs for Banani style)
 *   lucide-react: ChevronDown
 *
 * LAST UPDATED: 2026-05-04 — initial extraction; form state is local, submit goes to context
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useSignupContext } from "./context";
import { coralGrad, flag } from "./types";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z
    .string()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email address")
    .optional(),
  phone: z.string().min(6, "Enter a valid phone number"),
});
type FormValues = z.infer<typeof schema>;

const inputCls =
  "h-13 rounded-2xl bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-300 transition";

export function StepSignupForm() {
  const {
    currentIndex,
    visibleSteps,
    country,
    setPickerOpen,
    isSendingOtp,
    onSendOtp,
    mobileParam,
  } = useSignupContext();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: mobileParam },
  });

  useEffect(() => {
    if (mobileParam) setValue("phone", mobileParam);
  }, [mobileParam, setValue]);

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-5">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[30px] font-black text-foreground leading-tight">
          Create your account
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          A few quick details and you&apos;re all set.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSendOtp)} className="flex flex-col gap-3">
        {/* Name row */}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <input
              placeholder="First name *"
              autoComplete="given-name"
              {...register("firstName")}
              className={`w-full ${inputCls}`}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 ml-1">{errors.firstName.message}</p>
            )}
          </div>
          <div className="flex-1">
            <input
              placeholder="Last name"
              autoComplete="family-name"
              {...register("lastName")}
              className={`w-full ${inputCls}`}
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <input
            type="email"
            placeholder="Email (optional)"
            autoComplete="email"
            {...register("email")}
            className={`w-full ${inputCls}`}
          />
          {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}
        </div>

        {/* Phone row */}
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <div className="flex gap-2 h-13">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-1.5 px-3 rounded-2xl bg-white text-sm font-medium text-gray-700 shrink-0 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl leading-none">
                    {country ? flag(country.countryCode) : "🌐"}
                  </span>
                  <span>+{country?.callingCode ?? "91"}</span>
                  <ChevronDown className="size-3.5 text-gray-400" />
                </button>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="Mobile number"
                  className={`flex-1 ${inputCls}`}
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
          className="h-14 rounded-2xl text-white font-semibold text-[16px] mt-2 transition-opacity disabled:opacity-60"
          style={coralGrad}
        >
          {isSendingOtp ? "Sending…" : "Continue"}
        </button>
      </form>

      <p className="mt-auto pt-8 text-[12px] text-gray-400 text-center leading-relaxed">
        By continuing, you agree to our{" "}
        <Link href="/term-and-condition" className="text-orange-500 font-medium">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-orange-500 font-medium">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
