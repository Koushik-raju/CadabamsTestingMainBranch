/**
 * FILE: app/(public)/auth/signup/step-notification.tsx
 *
 * PURPOSE:
 *   Collects the user's notification preferences (SMS, email, WhatsApp).
 *
 * LOGIC OVERVIEW:
 *   Reads notifPhone/notifEmail/notifWhatsapp from context.data and writes back
 *   via updateData when a Switch is toggled. No permission dialogs needed —
 *   these are preference flags passed to the backend on account creation.
 *
 * DEPENDENCIES: useSignupContext, shadcn Switch, lucide-react icons, coralGrad
 *
 * LAST UPDATED: 2026-05-04 — initial extraction
 */

"use client";

import { Mail, MessageSquare, Phone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSignupContext } from "./context";
import { coralBtnCls, coralGrad } from "./types";

const CHANNELS = [
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
] as const;

export function StepNotification() {
  const { data, updateData, goNext } = useSignupContext();

  return (
    <div className="flex flex-col flex-1 gap-5">
      <div className="pt-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Almost there
        </p>
        <h1 className="text-[30px] font-black text-foreground leading-tight">Stay connected</h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Choose how you&apos;d like to receive updates
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-[var(--sh-1)] divide-y divide-border overflow-hidden">
        {CHANNELS.map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground">{label}</p>
              <p className="text-[12px] text-muted-foreground leading-snug">{desc}</p>
            </div>
            <Switch
              id={key}
              checked={data[key]}
              onCheckedChange={(checked) => updateData({ [key]: checked })}
            />
          </div>
        ))}
      </div>

      <button type="button" onClick={goNext} className={coralBtnCls} style={coralGrad}>
        Continue
      </button>
    </div>
  );
}
