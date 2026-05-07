/**
 * FILE: app/layout.tsx
 *
 * PURPOSE:
 *   Root layout for the Next.js app. Sets up global metadata, fonts, providers, and GTM/GA scripts.
 *   Wraps all pages with AppProviders (SWR, theme, etc.) and CapacitorInit for mobile shell support.
 *
 * LOGIC OVERVIEW:
 *   - Load Inter via next/font/google (variable font, injects --font-inter CSS var)
 *   - Define root metadata (title, description) — manifest auto-discovered from app/manifest.ts
 *   - Configure viewport for mobile/Capacitor
 *   - Inject GTM via GoogleTagManager and GA via GoogleAnalytics (@next/third-parties/google)
 *   - Wrap HTML with AppProviders and CapacitorInit
 *   - Use overflow-x-clip (not hidden) to avoid breaking position:sticky in WebKit/Capacitor
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   metadata — Metadata object (title, description)
 *   viewport — Viewport config (width, initialScale, maximumScale, userScalable, viewportFit, interactiveWidget, themeColor)
 *   RootLayout — Default export, accepts children ReactNode
 *
 * DEPENDENCIES:
 *   next/font/google (Inter)
 *   @next/third-parties/google (GoogleTagManager, GoogleAnalytics)
 *   @/components/common/android-safe-area-bars
 *   @/components/common/capacitor-init
 *   @/config/site (siteConfig.name, .description, .gtmId, .gaId)
 *   @/providers/app-providers
 *   globals.css
 *
 * LAST UPDATED: 2026-05-07 — safe area bars extracted to AndroidSafeAreaBars; only rendered on Android
 */

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AndroidSafeAreaBars } from "@/components/common/android-safe-area-bars";
import { CapacitorInit } from "@/components/common/capacitor-init";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  // Cream canvas (--mt-cream-bg / --background in globals.css). Tints mobile
  // browser address-bar so the chrome blends with the app's cream surface.
  themeColor: "#faf7f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning className="font-sans">
        <GoogleTagManager gtmId={siteConfig.gtmId} />
        <GoogleAnalytics gaId={siteConfig.gaId} />

        <AndroidSafeAreaBars />

        {/*
          Use overflow-x-clip (not overflow-x-hidden) — in WebKit (iOS/Capacitor)
          any overflow value other than "clip" creates a new scroll container, which
          silently breaks position:sticky on descendant headers. "clip" visually
          prevents horizontal overflow without creating a scroll container.
        */}
        <main>
          <AppProviders>
            <CapacitorInit />
            <div className="overflow-x-clip bg-background">{children}</div>
          </AppProviders>
        </main>
      </body>
    </html>
  );
}
