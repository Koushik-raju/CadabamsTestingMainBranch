/**
 * FILE: app/(public)/auth/login/page.tsx
 *
 * PURPOSE:
 *   Public login page for existing users. Orchestrates two-step OTP-based auth:
 *   phone entry → OTP verification. Delegates all rendering to sub-components
 *   under components/auth/.
 *
 * LOGIC OVERVIEW:
 *   Step 1 (phone): PhoneStep renders the form. onSendOtp submits via sendOtp;
 *   a 404 triggers AccountNotFoundModal.
 *   Step 2 (otp): OtpStep renders the code entry. Auto-verify fires when
 *   otp.length === 4. Successful verify calls login() then redirects to /home.
 *   Keyboard handling: a visualViewport "resize" listener scrolls the currently
 *   focused input into view whenever the soft keyboard appears/disappears. This
 *   is a pure-web solution — no Capacitor plugins needed.
 *   Country picker: CountryPickerDialog manages its own search state; parent
 *   only tracks the selected Country.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   step            — "phone" | "otp"; controls which screen is shown
 *   country         — selected Country; defaults to India on mount
 *   otp             — controlled 4-digit string; auto-verifies at length 4
 *   timer           — countdown (s) until OTP resend is allowed
 *   pickerOpen      — controls CountryPickerDialog visibility
 *   redirectModal   — controls AccountNotFoundModal visibility
 *   verifyingRef    — guard against double-verify on rapid auto-verify
 *   LoginContent    — main inner component
 *   LoginPage       — default export; Suspense wrapper with skeleton fallback
 *
 * DEPENDENCIES:
 *   useAuth, useAuthActions  — OTP send + verify flows
 *   react-hook-form + zod   — phone validation (exactly 10 digits)
 *   react-toastify          — error / success toasts
 *   country-codes-list      — country name / calling-code data
 *   useKeyboardPadding      — dynamic paddingBottom for keyboard overlap
 *   components/auth/*       — LoginHero, PhoneStep, OtpStep,
 *                             CountryPickerDialog, AccountNotFoundModal
 *
 * LAST UPDATED: 2026-05-07 — refactored into sub-components; 10-digit enforcement;
 *               visualViewport scroll-into-view keyboard fix
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import countryCodes from "country-codes-list";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { AccountNotFoundModal } from "@/components/auth/account-not-found-modal";
import type { Country } from "@/components/auth/country-picker-dialog";
import { CountryPickerDialog } from "@/components/auth/country-picker-dialog";
import { LoginHero } from "@/components/auth/login-hero";
import { OtpStep } from "@/components/auth/otp-step";
import { PhoneStep } from "@/components/auth/phone-step";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { useKeyboardPadding } from "@/hooks/use-keyboard-padding";

/*
 * Exactly 10 digits — no more, no less. Non-digit characters are stripped at
 * the input level in PhoneStep, so this validator acts as the final guard.
 */
const phoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
});
type PhoneForm = z.infer<typeof phoneSchema>;

function LoginContent() {
  const router = useRouter();
  const { login } = useAuth();
  const { sendOtp, verifyLogin, isSendingOtp, isVerifying } = useAuthActions();

  const bottomPadding = useKeyboardPadding();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [country, setCountry] = useState<Country | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [redirectModal, setRedirectModal] = useState(false);
  const verifyingRef = useRef(false);

  const countries = useMemo<Country[]>(() => {
    const list = countryCodes.customList(
      "countryCode",
      "{countryNameEn}|{countryCode}|{countryCallingCode}",
    );
    return Object.values(list).map((v) => {
      const [name, code, calling] = (v as string).split("|");
      return { name, countryCode: code, callingCode: calling.replace("+", "") };
    });
  }, []);

  /* Default to India on first mount. */
  useEffect(() => {
    if (country || countries.length === 0) return;
    const india = countries.find((c) => c.countryCode === "IN");
    if (india) setCountry(india);
  }, [countries, country]);

  const suggested = useMemo(
    () => countries.filter((c) => c.countryCode === "IN" || c.countryCode === "US"),
    [countries],
  );

  /* OTP resend countdown. */
  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  /*
   * Keyboard scroll-into-view — pure web, no Capacitor plugins.
   * When the soft keyboard opens, visualViewport fires "resize". We scroll
   * the currently focused input into view so it sits above the keyboard.
   * The paddingBottom from useKeyboardPadding ensures the scrollable container
   * has enough room beneath the input.
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

  const { control, handleSubmit, getValues } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const onSendOtp = async ({ phone }: PhoneForm) => {
    try {
      await sendOtp(phone, "login");
      toast.success("OTP sent successfully");
      setStep("otp");
      setTimer(30);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 404) {
        setRedirectModal(true);
        return;
      }
      if (e.status === 400) {
        toast.error("Invalid phone number");
        return;
      }
      toast.error("Failed to send OTP. Try again.");
    }
  };

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (code.length < 4 || verifyingRef.current) return;
      verifyingRef.current = true;
      try {
        await verifyLogin(getValues("phone"), code);
        toast.success("Welcome back!");
        login().catch(() => {});
        router.replace("/home");
      } catch (err: unknown) {
        const e = err as { status?: number };
        if (e.status === 401) {
          toast.error("Invalid OTP. Try again.");
          setOtp("");
          return;
        }
        if (e.status === 404) {
          toast.error("Account not found");
          setRedirectModal(true);
          return;
        }
        toast.error("Something went wrong. Try again.");
        setOtp("");
      } finally {
        verifyingRef.current = false;
      }
    },
    [verifyLogin, getValues, login, router],
  );

  /* Auto-verify when all 4 digits are entered. */
  useEffect(() => {
    if (otp.length === 4) handleVerifyOtp(otp);
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LoginHero />

      <div
        className="flex-1 flex flex-col px-6 overflow-y-auto"
        style={{ paddingBottom: bottomPadding }}
      >
        {step === "phone" ? (
          <PhoneStep
            control={control}
            country={country}
            isSendingOtp={isSendingOtp}
            onOpenPicker={() => setPickerOpen(true)}
            onSubmit={handleSubmit(onSendOtp)}
            onSignUp={() => router.push("/auth/signup")}
          />
        ) : (
          <OtpStep
            otp={otp}
            onChange={setOtp}
            timer={timer}
            isVerifying={isVerifying}
            callingCode={country?.callingCode ?? "91"}
            phone={getValues("phone")}
            onBack={() => {
              setStep("phone");
              setOtp("");
            }}
            onVerify={() => handleVerifyOtp(otp)}
            onResend={handleSubmit(onSendOtp)}
          />
        )}
      </div>

      <CountryPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        countries={countries}
        suggested={suggested}
        selected={country}
        onSelect={setCountry}
      />

      <AccountNotFoundModal
        open={redirectModal}
        onOpenChange={setRedirectModal}
        onSignUp={() => router.push(`/auth/signup?mobile=${getValues("phone")}`)}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Skeleton className="h-80 w-full max-w-sm rounded-3xl mx-6" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
