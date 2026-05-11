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
 *   @/components/common/capacitor-init
 *   @/config/site (siteConfig.name, .description, .gtmId, .gaId)
 *   @/providers/app-providers
 *   globals.css
 *
 * SAFE AREA MODEL (canonical — also documented in CLAUDE.md):
 *   - <body> pads top + bottom + left + right with env(safe-area-inset-*) so
 *     content always clears the notch / home indicator / landscape cutouts.
 *     On the current Capacitor shells (StatusBar.overlaysWebView:false on
 *     Android, contentInset:'automatic' on iOS) env() resolves to 0 where the
 *     native chrome already insets the WebView, so the padding is a no-op on
 *     non-notched / non-edge-to-edge devices and active on iPhone notch /
 *     home-indicator surfaces — making this safe as a web-only OTA update.
 *   - Two fixed paint overlays (top + bottom, z-100, bg-background) cover the
 *     safe-area strips so scrolled content cannot bleed through behind any
 *     translucent native chrome (iOS keyboard accessory, gesture pill area).
 *
 * LAST UPDATED: 2026-05-08 — OTA web fix: restored canonical safe-area pattern
 *   (top+bottom+l/r env() padding on body + bg paint overlays). No native /
 *   capacitor.config changes — works inside the already-shipped shell.
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
  // Cream canvas (--mt-cream-bg / --background in globals.css). Tints mobile
  // browser address-bar so the chrome blends with the app's cream surface.
  themeColor: "#faf7f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        suppressHydrationWarning
        className="font-sans bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      >
        <GoogleTagManager gtmId={siteConfig.gtmId} />
        <GoogleAnalytics gaId={siteConfig.gaId} />

        <>
          {/*
            Top safe-area paint strip. Sits over the notch / status-bar area so
            scrolled content can't bleed through behind translucent native
            chrome. Height collapses to 0 when env() is 0 (Android shell with
            overlaysWebView:false and non-notched iOS), so it is invisible and
            non-interactive on devices that don't need it. Pointer-events:none
            so it never intercepts taps on the back button / status bar tap-to-
            scroll-to-top.
          */}
          <div
            aria-hidden
            className="fixed inset-x-0 top-0 z-[100] bg-background pointer-events-none"
            style={{ height: "env(safe-area-inset-top)" }}
          />

          {/*
            Bottom safe-area paint strip — covers the iOS home-indicator zone
            and Android gesture-pill area. Same collapse-to-0 behaviour.
          */}
          <div
            aria-hidden
            className="fixed inset-x-0 bottom-0 z-[100] bg-background pointer-events-none"
            style={{ height: "env(safe-area-inset-bottom)" }}
          />
        </>

        {/*
          Use overflow-x-clip (not overflow-x-hidden) — in WebKit (iOS/Capacitor)
          any overflow value other than "clip" creates a new scroll container, which
          silently breaks position:sticky on descendant headers. "clip" visually
          prevents horizontal overflow without creating a scroll container.
        */}
        <main>
          <AppProviders>
            <CapacitorInit />
            <div className="overflow-x-clip bg-background min-h-screen">{children}</div>
          </AppProviders>
        </main>
      </body>
    </html>
  );
}
