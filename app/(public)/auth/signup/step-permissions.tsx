/**
 * FILE: app/(public)/auth/signup/step-permissions.tsx
 *
 * PURPOSE:
 *   Asks for Location, Bluetooth, and Activity Tracking (notifications) permissions.
 *   Each toggle actually triggers the corresponding browser permission dialog.
 *
 * LOGIC OVERVIEW:
 *   Location toggle → navigator.geolocation.getCurrentPosition (handled in context).
 *   Bluetooth toggle → navigator.bluetooth.requestDevice (handled in context).
 *   Tracking toggle → Notification.requestPermission (handled in context).
 *   If a permission is denied by the browser, the switch reverts to off.
 *   Continue advances to the signup-form step and writes onboarding_data to localStorage.
 *
 * DEPENDENCIES: useSignupContext, shadcn Switch, lucide-react icons, coralGrad
 *
 * LAST UPDATED: 2026-05-04 — real permission APIs wired via context handlers
 */

"use client";

import { Switch } from "@/components/ui/switch";
import { Bluetooth, Eye, MapPin } from "lucide-react";
import { useSignupContext } from "./context";
import { coralBtnCls, coralGrad } from "./types";

export function StepPermissions() {
  const { data, goNext, handleLocationToggle, handleBluetoothToggle, handleTrackingToggle } =
    useSignupContext();

  return (
    <div className="flex flex-col flex-1 gap-5">
      <div className="pt-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Last step before sign up
        </p>
        <h1 className="text-[30px] font-black text-foreground leading-tight">App permissions</h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Help us personalise your experience — you can change these anytime
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-[var(--sh-1)] divide-y divide-border overflow-hidden">
        {/* Location */}
        <div className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground">Location Access</p>
            <p className="text-[12px] text-muted-foreground leading-snug">
              Find clinics and services near you
            </p>
          </div>
          <Switch
            id="locationPermission"
            checked={data.locationPermission}
            onCheckedChange={handleLocationToggle}
          />
        </div>

        {/* Bluetooth */}
        <div className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bluetooth className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground">Bluetooth</p>
            <p className="text-[12px] text-muted-foreground leading-snug">
              Integrate with wearable health devices
            </p>
          </div>
          <Switch
            id="bluetoothPermission"
            checked={data.bluetoothPermission}
            onCheckedChange={handleBluetoothToggle}
          />
        </div>

        {/* Activity Tracking → Notification permission */}
        <div className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground">Activity Tracking</p>
            <p className="text-[12px] text-muted-foreground leading-snug">
              Receive personalised wellness notifications
            </p>
          </div>
          <Switch
            id="trackingPermission"
            checked={data.trackingPermission}
            onCheckedChange={handleTrackingToggle}
          />
        </div>
      </div>

      <button type="button" onClick={goNext} className={coralBtnCls} style={coralGrad}>
        Continue to Sign Up
      </button>
    </div>
  );
}
