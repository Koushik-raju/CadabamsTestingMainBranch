/**
 * FILE: app/layout.tsx
 *
 * PURPOSE:
 *   Root layout for the Next.js app. Sets up global metadata, fonts, providers, and GTM/GA scripts.
 *   Wraps all pages with AppProviders (SWR, theme, etc.) and CapacitorInit for mobile shell support.
 *
 * LOGIC OVERVIEW:
 *   - Load fonts (Urbanist as legacy, Inter via @font-face in globals.css)
 *   - Define root metadata (title, description) — manifest auto-discovered from app/manifest.ts
 *   - Configure viewport for mobile/Capacitor
 *   - Inject GTM and GA scripts at afterInteractive
 *   - Wrap HTML with AppProviders and CapacitorInit
 *   - Use overflow-x-clip (not hidden) to avoid breaking position:sticky in WebKit/Capacitor
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   metadata — Metadata object (title, description)
 *   viewport — Viewport config (width, initialScale, maximumScale, userScalable, viewportFit, interactiveWidget)
 *   RootLayout — Default export, accepts children ReactNode
 *
 * DEPENDENCIES:
 *   next/font/google (Urbanist)
 *   next/script (GTM/GA)
 *   @/components/common/capacitor-init
 *   @/config/site (siteConfig.name, .description, .gtmId, .gaId)
 *   @/providers/app-providers
 *   globals.css
 *
 * LAST UPDATED: 2026-05-06 — html `light` class (theme passthrough); body safe-area padding from upstream
 */
import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import Script from "next/script";
import { CapacitorInit } from "@/components/common/capacitor-init";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

/* Inter is loaded via @font-face in globals.css (3 optical cuts bundled locally).
   Urbanist is kept via next/font/google for any legacy usage. */
const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning className={`${urbanist.variable} light`}>
      <body
        suppressHydrationWarning
        className="font-sans overflow-x-hidden mt-(--safe-area-inset-top) pl-(--safe-area-inset-left) pr-(--safe-area-inset-right)"
      >
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
          f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${siteConfig.gtmId}');
        `}</Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${siteConfig.gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','${siteConfig.gaId}',{page_title:document.title,page_location:window.location.href,send_page_view:true});
        `}</Script>

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
