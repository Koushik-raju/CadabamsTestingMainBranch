/**
 * FILE: app/manifest.ts
 *
 * PURPOSE:
 *   PWA web manifest for MindTalk — defines icon, colors, display mode, and metadata for home screen installation.
 *   Next.js 14+ auto-discovers this file and serves it at /manifest.json. No manual route needed.
 *
 * LOGIC OVERVIEW:
 *   Export a single default function that returns the manifest object.
 *   Next.js framework invokes this at build time and serves the result as /manifest.json.
 *   No runtime logic; purely declarative PWA metadata.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   manifest() — Returns MetadataRoute.Manifest with name, colors, display mode, and icon array.
 *
 * DEPENDENCIES:
 *   next/MetadataRoute type
 *
 * LAST UPDATED: 2026-05-05 — Initial manifest creation for Phase 5B
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MindTalk by Cadabams",
    short_name: "MindTalk",
    description: "Your mental health companion",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf9",
    theme_color: "#f97316",
    icons: [
      {
        src: "/assets/auth/auth-bg.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
