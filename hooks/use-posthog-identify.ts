/**
 * FILE: hooks/use-posthog-identify.ts
 *
 * PURPOSE:
 *   Calls posthog.identify() whenever a logged-in user object is available,
 *   linking all PostHog events to a stable distinct ID and attaching profile
 *   traits for segmentation.
 *
 * LOGIC OVERVIEW:
 *   1. Accepts the User object (or null/undefined) from the auth context.
 *   2. On every change to sub: if sub is present, uses it directly as the
 *      PostHog distinct ID and calls posthog.identify() with name, email,
 *      phone_number, role, crmLeadId, dob, gender, and sub as traits.
 *   3. If sub is absent (user logged out or session not yet restored),
 *      the effect is a no-op — avoids identifying anonymous sessions.
 *   4. No posthog.reset() is called here; logout is handled by the auth flow
 *      where the caller should invoke posthog.reset() if needed.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   usePostHogIdentify   — hook; call with the User object from useAuth()
 *   user                 — User | null | undefined; the logged-in user
 *
 * DEPENDENCIES:
 *   posthog-js    — posthog.identify()
 *   @/types       — User interface
 *
 * LAST UPDATED: 2026-04-27 — use user.sub as distinctId; expand identify traits
 */

import posthog from "posthog-js";
import { useEffect } from "react";
import type { User } from "@/types";

export function usePostHogIdentify(user: User | null | undefined) {
  useEffect(() => {
    /* Guard: only identify when a real sub (JWT subject) is available. Without
       sub we cannot attach a stable distinct ID and would pollute the anonymous
       session instead of the real user profile. */
    if (!user?.sub) return;

    posthog.identify(user.sub, {
      name: user.name ?? null,
      email: user.email ?? null,
      phone_number: user.phone_number ?? null,
      role: "patient",
      crmLeadId: user.lead_id,
      dob: user.date_of_birth,
      gender: user.gender,
      sub: user.sub,
    });
  }, [user?.sub]);
}
