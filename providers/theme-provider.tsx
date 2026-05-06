/**
 * FILE: providers/theme-provider.tsx
 *
 * PURPOSE:
 *   Theme wrapper for the provider tree. The app is light-only; we avoid next-themes
 *   because its ThemeProvider renders an inline <script> for FOUC prevention, which
 *   triggers React 19’s “script tag while rendering” dev warning in client components.
 *
 * LOGIC OVERVIEW:
 *   Renders children only. Root `app/layout.tsx` sets `className="… light"` on <html>
 *   so Tailwind class-based dark mode tokens stay aligned with a fixed light theme.
 *
 * DEPENDENCIES:
 *   (none — next-themes removed from this wrapper)
 *
 * LAST UPDATED: 2026-05-06 — replace next-themes with passthrough for light-only app
 */
"use client";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
