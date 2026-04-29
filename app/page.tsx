/**
 * FILE: app/page.tsx
 *
 * PURPOSE:
 *   Root page of the application. Redirects authenticated users to /home and
 *   unauthenticated users to /auth/login (handled by middleware).
 *
 * LOGIC OVERVIEW:
 *   Calls Next.js redirect() to /home. Middleware interceptor handles unauthenticated
 *   users by redirecting to /auth/login before this page is reached.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   RootPage — Page export; simple redirect component
 *
 * DEPENDENCIES:
 *   Next.js: redirect function
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: file header added
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/home");
}
