/**
 * FILE: app/manifest.ts
 *
 * PURPOSE:
 *   PWA web manifest for MindTalk. Next.js auto-serves this at /manifest.webmanifest.
 *
 * LOGIC OVERVIEW:
 *   Default export returns a MetadataRoute.Manifest. Next.js renders it at build time
 *   (statically optimized — no Request-time APIs). Icons reference the pre-generated
 *   webp set in public/assets/icons/.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   manifest()  — returns the manifest object served at /manifest.webmanifest.
 *
 * DEPENDENCIES:
 *   next/MetadataRoute type
 *
 * LAST UPDATED: 2026-05-07 — Add display_override fallback chain, prefer_related_applications,
 *   and shortcuts (home / chat / journeys) for long-press home-icon menu. Theme color matches
 *   the cream canvas (--mt-cream-bg).
 */
import type { MetadataRoute } from "next";

const ICON_SIZES = [48, 72, 96, 128, 192, 256, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  const icons: MetadataRoute.Manifest["icons"] = ICON_SIZES.flatMap((s) => [
    {
      src: `/assets/icons/icon-${s}.webp`,
      sizes: `${s}x${s}`,
      type: "image/webp",
      purpose: "any",
    },
    {
      src: `/assets/icons/icon-${s}.webp`,
      sizes: `${s}x${s}`,
      type: "image/webp",
      purpose: "maskable",
    },
  ]);

  return {
    id: "/",
    name: "MindTalk by Cadabam's",
    short_name: "MindTalk",
    description: "Your mental health companion",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#faf7f4",
    theme_color: "#faf7f4",
    lang: "en",
    dir: "ltr",
    categories: ["health", "lifestyle", "medical"],
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Home",
        short_name: "Home",
        url: "/home",
        icons: [{ src: "/assets/icons/icon-192.webp", sizes: "192x192", type: "image/webp" }],
      },
      {
        name: "Chat",
        short_name: "Chat",
        url: "/chat",
        icons: [{ src: "/assets/icons/icon-192.webp", sizes: "192x192", type: "image/webp" }],
      },
      {
        name: "Journeys",
        short_name: "Journeys",
        url: "/journeys",
        icons: [{ src: "/assets/icons/icon-192.webp", sizes: "192x192", type: "image/webp" }],
      },
    ],
    icons,
  };
}
