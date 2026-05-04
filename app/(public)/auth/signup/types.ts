/**
 * FILE: app/(public)/auth/signup/types.ts
 *
 * PURPOSE:
 *   Shared types, constants, and utilities for the unified onboarding + signup flow.
 *
 * EXPORTS:
 *   Step                   — union of all step names in flow order
 *   Country                — country with name, ISO code, calling code
 *   OnboardingData         — accumulated data across all onboarding + assessment steps
 *   ALL_STEPS              — ordered step list (patient-form filtered at runtime)
 *   TAGS                   — assistance-selection chip labels
 *   RELATIONSHIPS          — patient relationship options
 *   GENDER_OPTIONS         — gender selection pills
 *   FEELING_OPTIONS        — overall feeling options with emoji and color
 *   SUPPORT_SYSTEM_OPTIONS — support system multiselect options
 *   CLINICAL_FREQ_OPTIONS  — frequency options for clinical check questions
 *   SAFETY_FREQ_OPTIONS    — frequency options for safety assessment questions
 *   coralGrad              — inline style for coral gradient buttons
 *   coralBtnCls            — Tailwind class string for coral buttons
 *   flag(code)             — ISO-2 → Unicode flag emoji
 *
 * LAST UPDATED: 2026-05-04 — added assessment steps (age/gender, feeling, struggles, calm-down, support, stress, clinical, thanks, safety)
 */

export type Step =
  | "service-for"
  | "patient-form"
  | "date-of-birth"
  | "age-gender"
  | "feeling"
  | "struggles"
  | "calm-down"
  | "assistance-selection"
  | "support-system"
  | "stress-level"
  | "clinical-check"
  | "thanks-check-in"
  | "safety-assessment"
  | "notification"
  | "permissions"
  | "signup-form"
  | "signup-otp";

export interface Country {
  name: string;
  countryCode: string;
  callingCode: string;
}

export interface OnboardingData {
  /* Who this session is for */
  serviceForSelf: boolean;
  patientFirstName: string;
  patientLastName: string;
  relationship: string;
  dob: string;
  /* Demographics */
  age: string;
  gender: string;
  /* Mental health intake */
  overallFeeling: string;
  struggles: string;
  tags: string[];
  supportSystem: string[];
  stressLevel: number;
  /* Clinical frequency questions */
  motivationFreq: string;
  anxietyFreq: string;
  sleepFreq: string;
  /* Safety assessment */
  hopelessnessFreq: string;
  selfHarmFreq: string;
  takingMedication: string;
  chronicPain: string;
  /* Notification + permission preferences */
  notifPhone: boolean;
  notifEmail: boolean;
  notifWhatsapp: boolean;
  locationPermission: boolean;
  bluetoothPermission: boolean;
  trackingPermission: boolean;
}

export const ALL_STEPS: Step[] = [
  "service-for",
  "patient-form",
  "date-of-birth",
  "age-gender",
  "feeling",
  "struggles",
  "calm-down",
  "assistance-selection",
  "support-system",
  "stress-level",
  "clinical-check",
  "thanks-check-in",
  "safety-assessment",
  "notification",
  "permissions",
  "signup-form",
  "signup-otp",
];

export const TAGS = [
  "Anxiety",
  "Depression",
  "Stress",
  "Relationship Issues",
  "Sleep Problems",
  "Trauma & PTSD",
  "Grief & Loss",
  "Self-esteem",
  "Anger Management",
  "I'm Not Sure",
];

export const RELATIONSHIPS = [
  "Parent",
  "Child",
  "Spouse / Partner",
  "Sibling",
  "Friend",
  "Guardian",
  "Other",
];

export const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;

export const FEELING_OPTIONS = [
  { value: "distressed", label: "Distressed", emoji: "😰", color: "#ef4444" },
  { value: "bad", label: "Bad", emoji: "😞", color: "#f97316" },
  { value: "okay", label: "Okay / Mixed", emoji: "😐", color: "#eab308" },
  { value: "good", label: "Good", emoji: "😊", color: "#84cc16" },
  { value: "great", label: "Great", emoji: "😄", color: "#22c55e" },
] as const;

export const SUPPORT_SYSTEM_OPTIONS = [
  "I have a strong, supportive family/social circle",
  "I have some support, but not daily",
  "I mostly handle things alone",
  "I feel isolated or insecure at times",
  "Prefer not to say / Unsure",
] as const;

export const CLINICAL_FREQ_OPTIONS = [
  "Not during the past 2 weeks",
  "Less than once a week",
  "Once or twice a week",
  "Three or more times a week",
  "Nearly every day",
] as const;

export const SAFETY_FREQ_OPTIONS = [
  "Not at all",
  "A few times a week",
  "2 to 3 times a week",
  "Several times a week",
  "Nearly every day",
] as const;

export const coralGrad = { background: "linear-gradient(135deg, #e05c3a, #f5894a)" };
export const coralBtnCls =
  "h-14 rounded-2xl text-white font-semibold text-[16px] transition-opacity disabled:opacity-40 mt-auto";

/* Convert ISO-2 country code (e.g. "IN") to its Unicode flag emoji. */
export function flag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)));
}
