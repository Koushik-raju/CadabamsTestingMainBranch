/**
 * FILE: providers/theme-provider.tsx
 *
 * PURPOSE:
 *   Thin wrapper around next-themes ThemeProvider. Locks the app to light mode
 *   so next-themes does not attempt to switch themes at runtime.
 *
 * LOGIC OVERVIEW:
 *   Renders NextThemesProvider with attribute="class", defaultTheme="light", and
 *   enableSystem=false. The class attribute strategy means next-themes sets a
 *   class on <html> to communicate the active theme to Tailwind.
 *   NOTE: next-themes v0.4.x injects an inline <script> for FOUC prevention;
 *   React 18+ emits a "script tag while rendering" warning for this — it is
 *   benign. The suppressHydrationWarning on <html>/<body> in app/layout.tsx
 *   handles the hydration side.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   ThemeProvider — re-exported wrapper consumed by app/layout.tsx
 *
 * DEPENDENCIES:
 *   next-themes — ThemeProvider
 *
 * LAST UPDATED: 2026-05-06 — added file header
 */

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
