/*
 * FILE: app/(auth)/onboarding/page.tsx
 *
 * PURPOSE:
 *   Multi-step onboarding flow for new users. Collects service context,
 *   patient details, date of birth, assistance type, and notification /
 *   permission preferences before creating a CRM lead.
 *
 * LOGIC OVERVIEW:
 *   1. Step machine driven by a `step` state string; each step renders
 *      its own form section inside a shared full-screen layout.
 *   2. Flow: service-for → patient-form → date-of-birth →
 *      assistance-selection → notification → permissions.
 *   3. On the final step, calls crmControllerCreateLead with the collected
 *      FormData, then redirects to the authenticated home screen.
 *   4. useAuth provides the current user; useSearchParams reads any
 *      deep-link pre-selections.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   step        — current step name driving conditional rendering
 *   formData    — accumulated field values across steps
 *   handleNext  — advances step and submits lead on the final step
 *
 * DEPENDENCIES:
 *   useAuth, crmControllerCreateLead, crmControllerGetRelationships
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Bluetooth,
  CalendarIcon,
  CheckCircle2,
  Eye,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { crmControllerCreateLead, crmControllerGetRelationships } from "@/sdk/backend-v2";

// ─── Types ────────────────────────────────────────────────

type Step =
  | "service-for"
  | "patient-form"
  | "date-of-birth"
  | "assistance-selection"
  | "notification"
  | "permissions";

interface Relationship {
  id: number;
  name: string;
}

interface FormData {
  serviceForSelf: boolean;
  patientFirstName: string;
  patientLastName: string;
  relationship: string;
  dob: string;
  tags: string[];
  notifPhone: boolean;
  notifEmail: boolean;
  notifWhatsapp: boolean;
  locationPermission: boolean;
  bluetoothPermission: boolean;
  trackingPermission: boolean;
}

const TAGS = [
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

const STEPS: Step[] = [
  "service-for",
  "patient-form",
  "date-of-birth",
  "assistance-selection",
  "notification",
  "permissions",
];

// ─── Onboarding ───────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const returnUrl = searchParams.get("returnUrl") ?? "";

  const [step, setStep] = useState<Step>("service-for");
  const [loading, setLoading] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [data, setData] = useState<FormData>({
    serviceForSelf: true,
    patientFirstName: "",
    patientLastName: "",
    relationship: "",
    dob: "",
    tags: [],
    notifPhone: true,
    notifEmail: true,
    notifWhatsapp: false,
    locationPermission: false,
    bluetoothPermission: false,
    trackingPermission: false,
  });

  useEffect(() => {
    crmControllerGetRelationships()
      .then((r) =>
        setRelationships((r.data as Array<{ id: number; name: string }> | undefined) ?? []),
      )
      .catch(() => {});
  }, []);

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const visibleSteps = STEPS.filter((s) => s !== "patient-form" || !data.serviceForSelf);
  const currentIndex = visibleSteps.indexOf(step);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === visibleSteps.length - 1;

  const goBack = () => {
    const prev = visibleSteps[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const goNext = () => {
    const next = visibleSteps[currentIndex + 1];
    if (next) setStep(next);
  };

  const handleDone = async () => {
    setLoading(true);
    try {
      await crmControllerCreateLead({
        body: {
          caller_mobile: user?.phone_number ?? "",
          partner_name:
            `${data.patientFirstName} ${data.patientLastName}`.trim() || (user?.name ?? ""),
          contact_name: user?.name ?? "",
        },
      });
    } catch {
      // Non-critical — continue anyway
    } finally {
      setLoading(false);
    }
    router.replace(returnUrl ? decodeURIComponent(returnUrl) : "/home");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top bar ── */}
      <div className="px-5 pt-12 pb-4 flex flex-col gap-4">
        {/* Progress segments */}
        <div className="flex gap-1.5">
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

        {/* Back button */}
        {!isFirst && (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>

      {/* ── Step content ── */}
      <div className="flex flex-col flex-1 px-5 pb-8 overflow-y-auto">
        {/* ── service-for ── */}
        {step === "service-for" && (
          <div className="flex flex-col flex-1 gap-6">
            <div className="pt-2">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                Welcome to Cadabams
              </p>
              <h1 className="text-[30px] font-black text-foreground leading-tight">
                Who are you seeking help for?
              </h1>
              <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
                We'll personalise your experience based on your answer.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {(
                [
                  {
                    label: "Myself",
                    desc: "Access therapy and wellness tools for your personal journey",
                    icon: User,
                    self: true,
                  },
                  {
                    label: "Someone Else",
                    desc: "Book care for a family member or loved one",
                    icon: Users,
                    self: false,
                  },
                ] as const
              ).map(({ label, desc, icon: Icon, self }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    set("serviceForSelf", self);
                    setStep(self ? "date-of-birth" : "patient-form");
                  }}
                  className="w-full text-left bg-card rounded-2xl border-2 p-5 flex items-start gap-4 transition-all active:scale-[0.98] shadow-[var(--sh-1)] border-transparent hover:border-primary/30"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-[16px] font-bold text-foreground">{label}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── patient-form ── */}
        {step === "patient-form" && (
          <div className="flex flex-col flex-1 gap-6">
            <div className="pt-2">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                Step {currentIndex + 1} of {visibleSteps.length}
              </p>
              <h1 className="text-[30px] font-black text-foreground leading-tight">
                Patient information
              </h1>
              <p className="text-[14px] text-muted-foreground mt-2">
                Tell us about the person you're booking for
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-[var(--sh-1)] p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="pFirst"
                    className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    First Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="pFirst"
                    autoComplete="given-name"
                    value={data.patientFirstName}
                    onChange={(e) => set("patientFirstName", e.target.value)}
                    placeholder="First"
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="pLast"
                    className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="pLast"
                    autoComplete="family-name"
                    value={data.patientLastName}
                    onChange={(e) => set("patientLastName", e.target.value)}
                    placeholder="Last"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Relationship <span className="text-primary">*</span>
                </Label>
                <Select value={data.relationship} onValueChange={(v) => set("relationship", v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={goNext}
              disabled={!data.patientFirstName || !data.relationship}
              className="w-full h-12 rounded-xl font-semibold mt-auto"
            >
              Continue
            </Button>
          </div>
        )}

        {/* ── date-of-birth ── */}
        {step === "date-of-birth" && (
          <div className="flex flex-col flex-1 gap-6">
            <div className="pt-2">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                Step {currentIndex + 1} of {visibleSteps.length}
              </p>
              <h1 className="text-[30px] font-black text-foreground leading-tight">
                When were you born?
              </h1>
              <p className="text-[14px] text-muted-foreground mt-2">
                Helps us personalise your care experience
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-[var(--sh-1)] p-5">
              <Label
                htmlFor="dob"
                className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Date of Birth
              </Label>
              <div className="relative mt-2">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="dob"
                  type="date"
                  autoComplete="bday"
                  value={data.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  className="pl-9 h-12 text-base"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <Button
              onClick={goNext}
              disabled={!data.dob}
              className="w-full h-12 rounded-xl font-semibold mt-auto"
            >
              Continue
            </Button>
          </div>
        )}

        {/* ── assistance-selection ── */}
        {step === "assistance-selection" && (
          <div className="flex flex-col flex-1 gap-5">
            <div className="pt-2">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                Step {currentIndex + 1} of {visibleSteps.length}
              </p>
              <h1 className="text-[30px] font-black text-foreground leading-tight">
                What brings you here?
              </h1>
              <p className="text-[14px] text-muted-foreground mt-2">
                Select all that apply — no judgement here
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {TAGS.map((tag) => {
                const selected = data.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      set(
                        "tags",
                        selected ? data.tags.filter((t) => t !== tag) : [...data.tags, tag],
                      )
                    }
                    className={cn(
                      "px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all active:scale-95",
                      selected
                        ? "bg-primary text-white border-primary shadow-[var(--sh-glow-orange)]"
                        : "bg-card text-foreground border-transparent shadow-[var(--sh-1)] hover:border-primary/40",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {data.tags.length > 0 && (
              <p className="text-[12px] text-primary font-medium">{data.tags.length} selected</p>
            )}

            <Button
              onClick={goNext}
              disabled={data.tags.length === 0}
              className="w-full h-12 rounded-xl font-semibold mt-auto"
            >
              Continue
            </Button>
          </div>
        )}

        {/* ── notification ── */}
        {step === "notification" && (
          <div className="flex flex-col flex-1 gap-5">
            <div className="pt-2">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                Almost there
              </p>
              <h1 className="text-[30px] font-black text-foreground leading-tight">
                Stay connected
              </h1>
              <p className="text-[14px] text-muted-foreground mt-2">
                Choose how you'd like to receive updates
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-[var(--sh-1)] divide-y divide-border overflow-hidden">
              {[
                {
                  key: "notifPhone" as const,
                  label: "Phone Notifications",
                  desc: "SMS alerts for appointments & reminders",
                  icon: Phone,
                },
                {
                  key: "notifEmail" as const,
                  label: "Email Updates",
                  desc: "Summaries, receipts, and session notes",
                  icon: Mail,
                },
                {
                  key: "notifWhatsapp" as const,
                  label: "WhatsApp",
                  desc: "Quick session reminders via WhatsApp",
                  icon: MessageSquare,
                },
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">{label}</p>
                    <p className="text-[12px] text-muted-foreground leading-snug">{desc}</p>
                  </div>
                  <Switch
                    id={key}
                    checked={data[key]}
                    onCheckedChange={() => set(key, !data[key])}
                  />
                </div>
              ))}
            </div>

            <Button onClick={goNext} className="w-full h-12 rounded-xl font-semibold mt-auto">
              Continue
            </Button>
          </div>
        )}

        {/* ── permissions ── */}
        {step === "permissions" && (
          <div className="flex flex-col flex-1 gap-5">
            <div className="pt-2">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                Last step
              </p>
              <h1 className="text-[30px] font-black text-foreground leading-tight">
                App permissions
              </h1>
              <p className="text-[14px] text-muted-foreground mt-2">
                Help us personalise your experience — you can change these anytime
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-[var(--sh-1)] divide-y divide-border overflow-hidden">
              {[
                {
                  key: "locationPermission" as const,
                  label: "Location Access",
                  desc: "Find clinics and services near you",
                  icon: MapPin,
                },
                {
                  key: "bluetoothPermission" as const,
                  label: "Bluetooth",
                  desc: "Integrate with wearable health devices",
                  icon: Bluetooth,
                },
                {
                  key: "trackingPermission" as const,
                  label: "Activity Tracking",
                  desc: "Personalise your wellness journey",
                  icon: Eye,
                },
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">{label}</p>
                    <p className="text-[12px] text-muted-foreground leading-snug">{desc}</p>
                  </div>
                  <Switch
                    id={key}
                    checked={data[key]}
                    onCheckedChange={() => set(key, !data[key])}
                  />
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-foreground/70 leading-snug">
                Your data is encrypted and never shared without your consent. You can revoke
                permissions at any time from settings.
              </p>
            </div>

            <Button
              onClick={handleDone}
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold mt-auto gap-2"
            >
              {loading ? (
                "Saving…"
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Get Started
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
