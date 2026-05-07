/**
 * FILE: components/auth/login-hero.tsx
 *
 * PURPOSE:
 *   Decorative hero image header used on the auth login/signup screens.
 *   Renders the auth-bg.png with a gradient fade at the bottom and the
 *   coral gradient logo tile.
 *
 * LOGIC OVERVIEW:
 *   Pure presentational — no props, no state. Renders a fixed-height image
 *   container with a bottom fade overlay and a positioned logo tile.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   LoginHero  — default export; self-contained hero block
 *
 * DEPENDENCIES:
 *   next/image  — optimized image
 *
 * LAST UPDATED: 2026-05-07 — extracted from login/page.tsx
 */

import Image from "next/image";

export function LoginHero() {
  return (
    <div className="relative h-72 shrink-0 overflow-hidden">
      <Image
        src="/assets/auth/auth-bg.png"
        alt=""
        fill
        className="object-cover object-center"
        priority
      />
      {/* Fade hero image into the page background */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent" />
      {/* Coral gradient logo tile */}
      <div
        className="absolute bottom-8 left-6 w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
        style={{ background: "linear-gradient(135deg, #e06050, #f4a07a)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3 L13.8 8.8 H20 L14.7 12.4 L16.5 18.2 L12 14.8 L7.5 18.2 L9.3 12.4 L4 8.8 H10.2 Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
}
