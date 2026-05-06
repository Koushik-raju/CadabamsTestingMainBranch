/**
 * FILE: app/(public)/auth/login/page.tsx
 *
 * PURPOSE:
 *   Public login page for existing users. Implements two-step OTP-based authentication
 *   behind a Banani-style design: decorative auth-bg image header, phone entry, then OTP
 *   verification.
 *
 * LOGIC OVERVIEW:
 *   Step 1 (phone): renders auth-bg.png art header, logo tile, "Start your journey" heading,
 *   a country-code selector (flag emoji + calling code) next to a phone number input, a coral
 *   gradient Continue button, a Sign up shortcut, and Terms / Privacy footer links. Submits
 *   phone to sendOtp; on 404 shows account-not-found modal.
 *   Step 2 (otp): OTPInput that auto-verifies at 4 digits. Resend timer counts down 30 s.
 *   Successful verify calls login() then redirects to /home.
 *   Country picker: Dialog with SUGGESTED section (India, United States) and searchable
 *   ALL COUNTRIES list; flag emoji computed from ISO country code via Unicode regional
 *   indicator chars.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   step              — "phone" | "otp"; controls which screen is shown
 *   country           — Selected Country object; defaults to India on mount
 *   otp               — Controlled 4-digit string; auto-verifies when length reaches 4
 *   timer             — Countdown (seconds) until OTP resend is allowed
 *   pickerOpen        — Boolean; opens the country picker dialog
 *   query             — Country search string
 *   flag(code)        — Pure fn: ISO-2 country code → Unicode flag emoji
 *   LoginContent      — Main inner component
 *   LoginPage         — Default export; Suspense wrapper with skeleton fallback
 *
 * DEPENDENCIES:
 *   useAuth, useAuthActions — OTP send + verify flows
 *   react-hook-form + zod  — Phone number validation
 *   react-toastify         — Error / success toasts
 *   country-codes-list     — Country name / calling-code data
 *   OTPInput               — components/common/otp-input
 *   shadcn/ui              — Button, Dialog, DialogContent, DialogTitle, ScrollArea, Skeleton
 *   lucide-react           — ArrowLeft, Check, ChevronDown, Search
 *   next/image             — auth-bg.png hero image
 *
 * LAST UPDATED: 2026-05-06 — keyboard-overlap fix: scrollable body + visualViewport padding
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import countryCodes from "country-codes-list";
import { ArrowLeft, Check, ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { OTPInput } from "@/components/common/otp-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { useKeyboardPadding } from "@/hooks/use-keyboard-padding";

interface Country {
  name: string;
  countryCode: string;
  callingCode: string;
}

/* Convert ISO-2 country code (e.g. "US") to its Unicode flag emoji. */
function flag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)));
}

const phoneSchema = z.object({
  phone: z.string().min(6, "Enter a valid phone number"),
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
  const [query, setQuery] = useState("");
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
    if (!country) {
      const india = countries.find((c) => c.countryCode === "IN");
      if (india) setCountry(india);
    }
  }, [countries, country]);

  const suggested = useMemo(
    () => countries.filter((c) => c.countryCode === "IN" || c.countryCode === "US"),
    [countries],
  );

  const filtered = useMemo(
    () =>
      countries.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.countryCode.toLowerCase().includes(query.toLowerCase()) ||
          c.callingCode.includes(query),
      ),
    [countries, query],
  );

  /* OTP resend countdown. */
  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

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
      {/* ── Hero image header ─────────────────────────────────────────────── */}
      <div className="relative h-72 shrink-0 overflow-hidden">
        <Image
          src="/assets/auth/auth-bg.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        {/* Fade-to-white gradient at the bottom of the hero */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent" />
        {/* Logo tile */}
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

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col px-6 overflow-y-auto"
        style={{ paddingBottom: bottomPadding }}
      >
        {step === "phone" ? (
          <>
            <h1 className="text-[26px] font-bold text-gray-900 mt-8 mb-2">Start your journey</h1>
            <p className="text-[14px] text-gray-400 mb-8 leading-relaxed">
              Enter your mobile number to sign in or create a new account.
            </p>

            <form onSubmit={handleSubmit(onSendOtp)} className="flex flex-col gap-3">
              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-2 h-13">
                      {/* Country selector */}
                      <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className="flex items-center gap-1.5 px-3 rounded-2xl bg-white text-sm font-medium text-gray-700 shrink-0 hover:bg-gray-200 transition-colors"
                      >
                        <span className="text-xl leading-none">
                          {country ? flag(country.countryCode) : "🌐"}
                        </span>
                        <span>+{country?.callingCode ?? "91"}</span>
                        <ChevronDown className="size-3.5 text-gray-400" />
                      </button>
                      {/* Phone number */}
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Mobile number"
                        className="flex-1 rounded-2xl bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-300 transition"
                        onFocus={(e) =>
                          e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })
                        }
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
              onClick={() => router.push("/auth/signup")}
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
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
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
                +{country?.callingCode ?? "91"} {getValues("phone")}
              </span>
            </p>

            <OTPInput value={otp} onChange={setOtp} />

            <button
              type="button"
              disabled={isVerifying || otp.length < 4}
              onClick={() => handleVerifyOtp(otp)}
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
                  onClick={handleSubmit(onSendOtp)}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Country picker dialog ─────────────────────────────────────────── */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm p-0" showCloseButton={false}>
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <DialogTitle className="text-[17px] font-semibold text-gray-900">
              Select Country
            </DialogTitle>
            <button
              onClick={() => setPickerOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search country or code"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <ScrollArea className="h-80">
            {/* Suggested section — only shown when not searching */}
            {!query && (
              <>
                <p className="px-5 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  Suggested
                </p>
                {suggested.map((c) => (
                  <button
                    key={`suggested-${c.countryCode}`}
                    onClick={() => {
                      setCountry(c);
                      setPickerOpen(false);
                      setQuery("");
                    }}
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xl leading-none">{flag(c.countryCode)}</span>
                    <span className="flex-1 text-left text-[15px] text-gray-800">{c.name}</span>
                    <span className="text-[14px] text-gray-400">+{c.callingCode}</span>
                    {country?.countryCode === c.countryCode && (
                      <Check className="size-4 text-orange-500" />
                    )}
                  </button>
                ))}
                <p className="px-5 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                  All Countries
                </p>
              </>
            )}
            {filtered.map((c) => (
              <button
                key={c.countryCode}
                onClick={() => {
                  setCountry(c);
                  setPickerOpen(false);
                  setQuery("");
                }}
                className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl leading-none">{flag(c.countryCode)}</span>
                <span className="flex-1 text-left text-[15px] text-gray-800">{c.name}</span>
                <span className="text-[14px] text-gray-400">+{c.callingCode}</span>
                {country?.countryCode === c.countryCode && (
                  <Check className="size-4 text-orange-500" />
                )}
              </button>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Account not found modal ───────────────────────────────────────── */}
      <Dialog open={redirectModal} onOpenChange={setRedirectModal}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Account not found</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            We couldn&apos;t find an account with this number. Would you like to sign up?
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setRedirectModal(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push(`/auth/signup?mobile=${getValues("phone")}`)}
            >
              Sign Up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
