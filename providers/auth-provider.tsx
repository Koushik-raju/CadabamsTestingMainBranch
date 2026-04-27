/**
 * FILE: providers/auth-provider.tsx
 *
 * PURPOSE:
 *   Mounts the AuthContext for the entire app and triggers a PostHog identify
 *   call whenever the authenticated user object changes.
 *
 * LOGIC OVERVIEW:
 *   1. Calls useAuthProvider() to obtain { user, login, logout } and exposes
 *      them via AuthContext so any descendant can call useAuth().
 *   2. Passes user to usePostHogIdentify() — that hook fires posthog.identify()
 *      once lead_id is available (or is a no-op when user is null).
 *   3. This is the correct wiring point because AuthProvider is inside
 *      PostHogProvider, so posthog is guaranteed to be initialised before
 *      identify() is called.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AuthProvider         — wraps app with auth context + PostHog identity
 *   value.user           — User | null; the currently logged-in user
 *   usePostHogIdentify   — side-effect hook; identifies user in PostHog
 *
 * DEPENDENCIES:
 *   useAuthProvider          — from @/hooks/use-auth
 *   usePostHogIdentify       — from @/hooks/use-posthog-identify
 *
 * LAST UPDATED: 2026-04-27 — added PostHog identify wiring
 */
'use client';

import { AuthContext, useAuthProvider } from '@/hooks/use-auth';
import { usePostHogIdentify } from '@/hooks/use-posthog-identify';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthProvider();

  /* Identify the user in PostHog whenever the auth session changes.
     usePostHogIdentify is a no-op until lead_id is present, so this is safe
     to call on every render cycle without double-firing. */
  usePostHogIdentify(value.user);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
