/**
 * FILE: app/(public)/login/page.tsx
 *
 * PURPOSE:
 *   Redirect page that forwards requests from /login to /auth/login while preserving
 *   all query parameters. Normalizes the login URL path.
 *
 * LOGIC OVERVIEW:
 *   Iterates over searchParams, converts any array values to strings, builds a query
 *   string, and redirects to /auth/login with the complete query.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   searchParams      — Next.js route searchParams object (could be string, array, or undefined)
 *   params            — Built URLSearchParams from searchParams
 *   qs                — Query string ready for URL appending
 *   LoginRedirect     — Page export; receives searchParams and redirects to /auth/login
 *
 * DEPENDENCIES:
 *   Next.js: redirect function
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: file header added
 */

import { redirect } from "next/navigation";

export default function LoginRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) params.set(k, Array.isArray(v) ? v[0] : v);
  }
  const qs = params.toString();
  redirect(`/auth/login${qs ? `?${qs}` : ""}`);
}
