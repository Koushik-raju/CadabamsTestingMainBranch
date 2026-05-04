/**
 * FILE: app/(public)/auth/signup/context.tsx
 *
 * PURPOSE:
 *   Shared React context for the unified onboarding + signup flow. Holds all step
 *   state, onboarding data, country picker state, OTP state, and every handler so
 *   that step components are zero-prop and self-contained.
 *
 * LOGIC OVERVIEW:
 *   SignupProvider initialises all state, builds the visibleSteps array (hides
 *   patient-form when serviceForSelf=true), exposes goBack/goNext navigation,
 *   handles permission APIs (geolocation, Web Bluetooth, Notification),
 *   drives the sendOtp → verifySignup → createLead → submitBaselineAssessment → /home
 *   flow, and stores submitted form values so the OTP step and resend handler can
 *   access them.
 *
 *   After a successful verifySignup + CRM lead creation, the full collected
 *   OnboardingData is submitted to POST /me/baseline-assessment. This call is
 *   best-effort — a failure does not block account creation or navigation.
 *
 * KEY EXPORTS:
 *   SignupFormValues    — shape submitted by the signup form step
 *   SignupContextValue  — full context shape
 *   SignupProvider      — wraps the page; requires Suspense ancestor (uses useSearchParams)
 *   useSignupContext    — hook consumed by every step component
 *
 * DEPENDENCIES:
 *   useAuth, useAuthActions, crmControllerCreateLead,
 *   baselineAssessmentMeControllerCreate
 *   country-codes-list, react-toastify, next/navigation
 *
 * LAST UPDATED: 2026-05-04 — pass email to sendOtp so it reaches the backend OTP endpoint
 */

"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { baselineAssessmentMeControllerCreate, crmControllerCreateLead } from "@/sdk/backend-v2";
import type { CreateBaselineAssessmentDto } from "@/sdk/backend-v2";
import countryCodes from "country-codes-list";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { ALL_STEPS, type Country, type OnboardingData, type Step } from "./types";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SignupFormValues {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
}

export interface SignupContextValue {
  // ── Navigation ────────────────────────────────────────────────────────────
  step: Step;
  visibleSteps: Step[];
  currentIndex: number;
  isFirst: boolean;
  goBack: () => void;
  goNext: () => void;
  setStep: (s: Step) => void;

  // ── Onboarding data ───────────────────────────────────────────────────────
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;

  // ── Country picker ────────────────────────────────────────────────────────
  country: Country | null;
  setCountry: (c: Country) => void;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  query: string;
  setQuery: (q: string) => void;
  countries: Country[];
  suggested: Country[];
  filtered: Country[];

  // ── OTP / signup ──────────────────────────────────────────────────────────
  otp: string;
  setOtp: (otp: string) => void;
  timer: number;
  isSendingOtp: boolean;
  isVerifying: boolean;
  submittedPhone: string;
  mobileParam: string;

  // ── Handlers ──────────────────────────────────────────────────────────────
  handleLocationToggle: (checked: boolean) => Promise<void>;
  handleBluetoothToggle: (checked: boolean) => Promise<void>;
  handleTrackingToggle: (checked: boolean) => Promise<void>;
  onSendOtp: (form: SignupFormValues) => Promise<void>;
  handleResendOtp: () => Promise<void>;
  handleSignup: (code: string) => Promise<void>;
}

// ─── Baseline assessment payload builder ──────────────────────────────────────

/*
 * Maps the local OnboardingData shape to the SDK CreateBaselineAssessmentDto.
 * Field names differ (e.g. dob → dateOfBirth, notifPhone → notificationPhone)
 * and types differ for yes/no questions (string "yes"/"no" → boolean).
 * Empty strings are converted to undefined so the backend ignores them.
 */
function buildAssessmentPayload(d: OnboardingData): CreateBaselineAssessmentDto {
  return {
    serviceForSelf: d.serviceForSelf,
    patientFirstName: d.patientFirstName || undefined,
    patientLastName: d.patientLastName || undefined,
    relationship: d.relationship || undefined,
    dateOfBirth: d.dob || undefined,
    age: d.age ? parseInt(d.age, 10) : undefined,
    gender: d.gender || undefined,
    overallFeeling:
      (d.overallFeeling as CreateBaselineAssessmentDto["overallFeeling"]) || undefined,
    struggles: d.struggles || undefined,
    tags: d.tags.length ? d.tags : undefined,
    supportSystem: d.supportSystem.length ? d.supportSystem : undefined,
    stressLevel: d.stressLevel,
    motivationFrequency:
      (d.motivationFreq as CreateBaselineAssessmentDto["motivationFrequency"]) || undefined,
    anxietyFrequency:
      (d.anxietyFreq as CreateBaselineAssessmentDto["anxietyFrequency"]) || undefined,
    sleepFrequency: (d.sleepFreq as CreateBaselineAssessmentDto["sleepFrequency"]) || undefined,
    hopelessnessFrequency:
      (d.hopelessnessFreq as CreateBaselineAssessmentDto["hopelessnessFrequency"]) || undefined,
    selfHarmFrequency:
      (d.selfHarmFreq as CreateBaselineAssessmentDto["selfHarmFrequency"]) || undefined,
    takingMedication: d.takingMedication ? d.takingMedication === "yes" : undefined,
    hasChronicPain: d.chronicPain ? d.chronicPain === "yes" : undefined,
    notificationPhone: d.notifPhone,
    notificationEmail: d.notifEmail,
    notificationWhatsapp: d.notifWhatsapp,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SignupContext = createContext<SignupContextValue | null>(null);

export function useSignupContext(): SignupContextValue {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error("useSignupContext must be used inside <SignupProvider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SignupProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { sendOtp, verifySignup, isSendingOtp, isVerifying } = useAuthActions();

  const mobileParam = searchParams.get("mobile") ?? "";

  // ── Step ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("service-for");

  // ── Onboarding data ───────────────────────────────────────────────────────
  const [data, setData] = useState<OnboardingData>({
    serviceForSelf: true,
    patientFirstName: "",
    patientLastName: "",
    relationship: "",
    dob: "",
    age: "",
    gender: "",
    overallFeeling: "",
    struggles: "",
    tags: [],
    supportSystem: [],
    stressLevel: 5,
    motivationFreq: "",
    anxietyFreq: "",
    sleepFreq: "",
    hopelessnessFreq: "",
    selfHarmFreq: "",
    takingMedication: "",
    chronicPain: "",
    notifPhone: true,
    notifEmail: true,
    notifWhatsapp: false,
    locationPermission: false,
    bluetoothPermission: false,
    trackingPermission: false,
  });

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Country picker ────────────────────────────────────────────────────────
  const [country, setCountry] = useState<Country | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

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

  // ── Step navigation ───────────────────────────────────────────────────────
  const visibleSteps = useMemo(
    () => ALL_STEPS.filter((s) => !(s === "patient-form" && data.serviceForSelf)),
    [data.serviceForSelf],
  );

  const currentIndex = visibleSteps.indexOf(step);
  const isFirst = currentIndex === 0;

  const goBack = useCallback(() => {
    const prev = visibleSteps[currentIndex - 1];
    if (prev) setStep(prev);
  }, [visibleSteps, currentIndex]);

  const goNext = useCallback(() => {
    /* Persist onboarding data before entering the signup form. */
    if (step === "permissions") {
      localStorage.setItem("onboarding_data", JSON.stringify(data));
    }
    const next = visibleSteps[currentIndex + 1];
    if (next) setStep(next);
  }, [step, data, visibleSteps, currentIndex]);

  // ── OTP timer ─────────────────────────────────────────────────────────────
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [submittedForm, setSubmittedForm] = useState<SignupFormValues | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // ── Permission handlers ───────────────────────────────────────────────────

  const handleLocationToggle = async (checked: boolean) => {
    if (!checked) {
      updateData({ locationPermission: false });
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(() => resolve(), reject, { timeout: 10000 });
      });
      updateData({ locationPermission: true });
    } catch {
      toast.error("Location permission was denied");
      updateData({ locationPermission: false });
    }
  };

  const handleBluetoothToggle = async (checked: boolean) => {
    if (!checked) {
      updateData({ bluetoothPermission: false });
      return;
    }
    /* Web Bluetooth: opens the browser's device-picker dialog. */
    const bt = (
      navigator as unknown as { bluetooth?: { requestDevice(o: unknown): Promise<unknown> } }
    ).bluetooth;
    if (!bt) {
      toast.error("Bluetooth is not supported on this browser");
      return;
    }
    try {
      await bt.requestDevice({ acceptAllDevices: true });
      updateData({ bluetoothPermission: true });
    } catch {
      /* User dismissed the device picker — treated as denied. */
      updateData({ bluetoothPermission: false });
    }
  };

  const handleTrackingToggle = async (checked: boolean) => {
    if (!checked) {
      updateData({ trackingPermission: false });
      return;
    }
    if (!("Notification" in window)) {
      toast.error("Notifications not supported on this device");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      updateData({ trackingPermission: result === "granted" });
      if (result !== "granted") toast.error("Notification permission was denied");
    } catch {
      updateData({ trackingPermission: false });
    }
  };

  // ── Signup handlers ───────────────────────────────────────────────────────

  const onSendOtp = async (form: SignupFormValues) => {
    try {
      await sendOtp(form.phone, "signup", form.email || undefined);
      toast.success("OTP sent successfully");
      setSubmittedForm(form);
      setSubmittedPhone(form.phone);
      setStep("signup-otp");
      setTimer(30);
    } catch {
      toast.error("Failed to send OTP. Try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!submittedPhone) return;
    try {
      await sendOtp(submittedPhone, "signup");
      toast.success("OTP resent");
      setTimer(30);
    } catch {
      toast.error("Failed to resend OTP. Try again.");
    }
  };

  const handleSignup = useCallback(
    async (code: string) => {
      if (code.length < 4 || verifyingRef.current || !submittedForm) return;
      verifyingRef.current = true;
      const { phone, firstName, lastName, email } = submittedForm;
      try {
        await verifySignup({
          phone,
          otp: code,
          firstName,
          lastName: lastName || undefined,
          email: email || undefined,
          countryCode: country?.callingCode ? Number(country.callingCode) : undefined,
        });
        toast.success("Account created! Welcome to Cadabams.");

        /* CRM lead creation — best-effort; failure does not block signup. */
        try {
          await crmControllerCreateLead({
            body: {
              caller_mobile: phone,
              partner_name: `${firstName} ${lastName ?? ""}`.trim(),
              contact_name: firstName,
            },
          });
        } catch {}

        /* Submit the collected onboarding questionnaire as a baseline assessment.
           The JWT issued by verifySignup carries crmLeadId, so the backend can
           associate this record with the patient without any extra param. */
        try {
          await baselineAssessmentMeControllerCreate({
            body: buildAssessmentPayload(data),
          });
        } catch {}

        localStorage.removeItem("onboarding_data");
        login().catch(() => {});
        router.replace("/home");
      } catch (err: unknown) {
        const e = err as { status?: number; error?: string };
        if (e.error?.includes("already exists")) {
          toast.error("Account already exists");
          router.push("/auth/login");
          return;
        }
        toast.error(e.error ?? "Signup failed. Try again.");
        setOtp("");
      } finally {
        verifyingRef.current = false;
      }
    },
    [verifySignup, submittedForm, country, login, router],
  );

  /* Auto-verify when all 4 OTP digits are entered. */
  useEffect(() => {
    if (otp.length === 4) handleSignup(otp);
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────

  const value: SignupContextValue = {
    step,
    visibleSteps,
    currentIndex,
    isFirst,
    goBack,
    goNext,
    setStep,
    data,
    updateData,
    country,
    setCountry,
    pickerOpen,
    setPickerOpen,
    query,
    setQuery,
    countries,
    suggested,
    filtered,
    otp,
    setOtp,
    timer,
    isSendingOtp,
    isVerifying,
    submittedPhone,
    mobileParam,
    handleLocationToggle,
    handleBluetoothToggle,
    handleTrackingToggle,
    onSendOtp,
    handleResendOtp,
    handleSignup,
  };

  return <SignupContext.Provider value={value}>{children}</SignupContext.Provider>;
}
