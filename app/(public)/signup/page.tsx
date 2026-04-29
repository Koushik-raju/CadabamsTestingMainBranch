/**
 * FILE: app/(public)/signup/page.tsx
 *
 * PURPOSE:
 *   Redirect page that forwards requests from /signup to /auth/signup while preserving
 *   all query parameters. Normalizes the signup URL path.
 *
 * LOGIC OVERVIEW:
 *   Iterates over searchParams, converts any array values to strings, builds a query
 *   string, and redirects to /auth/signup with the complete query.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   searchParams      — Next.js route searchParams object (could be string, array, or undefined)
 *   params            — Built URLSearchParams from searchParams
 *   qs                — Query string ready for URL appending
 *   SignupRedirect    — Page export; receives searchParams and redirects to /auth/signup
 *
 * DEPENDENCIES:
 *   Next.js: redirect function
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: file header added
 */

import { redirect } from "next/navigation";

export default function SignupRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) params.set(k, Array.isArray(v) ? v[0] : v);
  }
  const qs = params.toString();
  redirect(`/auth/signup${qs ? `?${qs}` : ""}`);
}
