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
 *   viewport — Viewport config (width, initialScale, maximumScale, userScalable, viewportFit, interactiveWidget)
 *   RootLayout — Default export, accepts children ReactNode
 *
 * DEPENDENCIES:
 *   next/font/google (Inter)
 *   @next/third-parties/google (GoogleTagManager, GoogleAnalytics)
 *   @/components/common/capacitor-init
 *   @/config/site (siteConfig.name, .description, .gtmId, .gaId)
 *   @/providers/app-providers
 *   globals.css
 *
 * LAST UPDATED: 2026-05-06 — drop body safe-area padding (.auth-layout-wrapper handles it via --safe-area-inset-* vars set by the native plugin); overlay divs now read the same CSS vars so they cover the padded zone exactly
 */

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        suppressHydrationWarning
        className="font-sans pl-(--safe-area-inset-left) pr-(--safe-area-inset-right)"
      >
        {/*
          Safe-area top/bottom overlays — height matches --safe-area-inset-* so
          they cover exactly the zone .auth-layout-wrapper pads. We use the CSS
          var (not env()) because on Capacitor iOS with StatusBar.overlaysWebView
          env(safe-area-inset-top) reports 0; capacitor-plugin-safe-area writes
          the real notch value into --safe-area-inset-top.
        */}
        <div className="fixed top-0 inset-x-0 h-[var(--safe-area-inset-top)] bg-background z-100" />
        <div className="fixed bottom-0 inset-x-0 h-[var(--safe-area-inset-bottom)] bg-background z-100" />

        <GoogleTagManager gtmId={siteConfig.gtmId} />
        <GoogleAnalytics gaId={siteConfig.gaId} />

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
