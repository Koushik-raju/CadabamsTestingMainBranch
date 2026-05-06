/**
 * FILE: providers/app-providers.tsx
 *
 * PURPOSE:
 *   Composes all React context providers for the application in a single
 *   wrapper component used by the root layout.
 *
 * LOGIC OVERVIEW:
 *   Provider order (outermost → innermost):
 *     SWRProvider          — global SWR config (revalidateOnFocus: false)
 *     ThemeProvider        — passthrough (light-only; html `light` class in root layout)
 *     DeviceProvider       — Capacitor device/platform detection
 *     PostHogProvider      — initialises PostHog analytics; must wrap AuthProvider
 *                            so posthog.init() runs before identify() is called
 *     AuthProvider         — auth session + calls usePostHogIdentify internally
 *     MastraDataContext    — Mastra AI data context
 *   ToastContainer sits inside AuthProvider to access theme tokens.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AppProviders   — root provider tree; used once in app/layout.tsx
 *   children       — full page subtree
 *
 * DEPENDENCIES:
 *   SWRProvider, ThemeProvider, DeviceProvider, PostHogProvider, AuthProvider,
 *   MastraDataContextProvider, react-toastify
 *
 * LAST UPDATED: 2026-04-27 — added PostHogProvider wrapping AuthProvider
 */
"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MastraDataContextProvider } from "@/contexts/mastra-data-context";
import { AuthProvider } from "./auth-provider";
import { DeviceProvider } from "./device-provider";
import { PostHogProvider } from "./posthog-provider";
import { SWRProvider } from "./swr-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <ThemeProvider>
        <DeviceProvider>
          {/* PostHogProvider must wrap AuthProvider so posthog.init() completes
              before AuthProvider calls usePostHogIdentify → posthog.identify() */}
          <PostHogProvider>
            <AuthProvider>
              <MastraDataContextProvider>{children}</MastraDataContextProvider>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar
                closeOnClick
                pauseOnHover
                theme="light"
                toastClassName="!rounded-xl !text-sm !font-sans !shadow-md"
              />
            </AuthProvider>
          </PostHogProvider>
        </DeviceProvider>
      </ThemeProvider>
    </SWRProvider>
  );
}
