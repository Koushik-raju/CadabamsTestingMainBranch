/**
 * FILE: providers/theme-provider.tsx
 *
 * PURPOSE:
 *   Passthrough wrapper for the provider tree. The app is light-only; we do not
 *   use `next-themes` because its ThemeProvider injects a `<script>` during
 *   render for FOUC prevention, which React 19 surfaces as a console error.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   ThemeProvider — consumed by app-providers.tsx
 *
 * LAST UPDATED: 2026-05-06 — remove next-themes (React 19 script-in-tree warning)
 */

import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return children;
}
