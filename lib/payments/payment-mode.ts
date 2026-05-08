/**
 * FILE: lib/payments/payment-mode.ts
 *
 * PURPOSE:
 *   Single source of truth for which Razorpay flow the app should use.
 *   Lets us toggle between hosted Payment Link redirect (`link`) and
 *   in-app Standard Checkout modal (`inapp`) via one env var without
 *   touching call sites.
 *
 * LOGIC OVERVIEW:
 *   1. Read `NEXT_PUBLIC_PAYMENT_MODE` at module load. Anything other
 *      than the literal string `"inapp"` is treated as `"link"` — we
 *      default to link because that is the currently desired behavior
 *      (rolled back from in-app while in-app is being stabilized).
 *   2. Export the resolved mode plus two boolean predicates so call
 *      sites can branch with a clear intent (`isLinkMode()` reads
 *      better than `PAYMENT_MODE === "link"`).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   PaymentMode  — `"link" | "inapp"` discriminator
 *   PAYMENT_MODE — the resolved mode for this build
 *   isLinkMode   — true when the app should redirect to a hosted link
 *   isInAppMode  — true when the app should open Standard Checkout
 *
 * DEPENDENCIES:
 *   process.env.NEXT_PUBLIC_PAYMENT_MODE — must be inlined by Next at
 *     build time, hence the `NEXT_PUBLIC_` prefix.
 *
 * LAST UPDATED: 2026-05-08 — initial version (Razorpay link/inapp toggle).
 */

export type PaymentMode = "link" | "inapp";

/*
 * Default = "link". Setting NEXT_PUBLIC_PAYMENT_MODE=inapp opts back
 * into the Standard Checkout flow. Any other value (including unset,
 * empty string, typos) collapses to "link" so we never silently ship
 * a half-configured in-app build.
 */
export const PAYMENT_MODE: PaymentMode =
  process.env.NEXT_PUBLIC_PAYMENT_MODE === "inapp" ? "inapp" : "link";

export const isLinkMode = (): boolean => PAYMENT_MODE === "link";
export const isInAppMode = (): boolean => PAYMENT_MODE === "inapp";
