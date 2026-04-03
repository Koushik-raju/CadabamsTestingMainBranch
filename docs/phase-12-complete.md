# Phase 12: Analytics, Testing & Polish — Complete

**Date:** 2026-04-03  
**Branch:** main

---

## 1. Analytics Implementation

### `services/analytics.service.ts`
Unified analytics singleton that wraps Firebase Analytics (via `lib/firebase/analytics.ts`) and Google Analytics 4/GTM (via `window.gtag`). All calls are wrapped in try-catch so analytics errors never crash the app.

Methods implemented:
- `trackPageView(path, title?)`
- `trackEvent(name, params?)`
- `identifyUser(userId, traits?)`
- `trackLogin(method)`
- `trackSignup()`
- `trackAppointmentBooked(doctorId, specialty)`
- `trackPaymentCompleted(amount, currency)`
- `trackJourneyStarted(journeyId, journeyName)`
- `trackAssessmentCompleted(assessmentId, score?)`
- `trackChatMessage(isAI)`
- `trackScreenView(screenName)`

Firebase imports are deferred through `lib/firebase/analytics.ts` which already performs a dynamic `isSupported()` check.

### `hooks/use-analytics.ts`
React hook that exposes `analyticsService` methods for use in components. Marked `'use client'`.

### `components/analytics-initializer.tsx`
Client component (`'use client'`) mounted in the root layout inside `<AppProviders>`. Uses `usePathname` to track page views on every route change and `useAuth` to identify users when auth state changes. Returns `null` (no UI).

### Root Layout Update
`app/layout.tsx` now imports and renders `<AnalyticsInitializer />` inside `AppProviders`.

---

## 2. TypeScript Errors Fixed

Initial `pnpm tsc --noEmit` output (before fixes):

| File | Error |
|------|-------|
| `app/(public)/checkout/page.tsx` | Conflicting `Window.Razorpay` declarations (TS2687, TS2717) |
| `app/(public)/checkout/page.tsx` | `window.Razorpay` possibly undefined (TS18048) |
| `lib/capacitor/razorpay.ts` | `Cannot find module '@capacitor-community/razorpay'` (TS2307) |

### Fixes Applied

1. **Removed duplicate `declare global { interface Window { Razorpay } }` from `checkout/page.tsx`** — Phase 11 had already declared this in `types/razorpay.d.ts` with the correct optional signature.

2. **Added null-check guard in `checkout/page.tsx`** — Extracted `window.Razorpay` into a local `RazorpayCtor` variable before calling `new`, satisfying narrowing inside the Promise constructor.

3. **Created `types/vendor.d.ts`** — Module declaration for `@capacitor-community/razorpay` (native-only optional dependency) so TypeScript no longer errors on the dynamic import in `lib/capacitor/razorpay.ts`.

Final result: `pnpm tsc --noEmit` exits with no errors (0 warnings).

---

## 3. ESLint Issues Resolved

ESLint check was blocked by permissions. The following issues were identified by code inspection and addressed:

- `checkout/page.tsx`: removed the non-standard `Razorpay` window declaration that would have triggered `@typescript-eslint/no-explicit-any` on the `unknown` cast.
- All new files (`analytics.service.ts`, `use-analytics.ts`, `analytics-initializer.tsx`) use `unknown` rather than `any` throughout.

---

## 4. Build Output

Build command: `pnpm build`  
Next.js version: 16.2.2 (Turbopack)

```
✓ Compiled successfully in 3.3s
✓ Generating static pages using 7 workers (49/49) in 287ms
```

**Route count: 49 routes**

| Type | Count |
|------|-------|
| Static (○) | 45 |
| Dynamic (ƒ) | 4 (`/journey/[id]`, `/mindful-minutes/[slug]`, `/self-journaling/[date]`, `/wellness-resources/[slug]`, `/zego`) |

No build errors. One known warning: Next.js 16 workspace root inference (multiple lockfiles) — non-blocking.

---

## 5. Performance Improvements

### New `loading.tsx` files added
- `app/(auth)/home/loading.tsx` — spinner for home page data fetch
- `app/(auth)/profile/loading.tsx` — spinner for profile page

### New `error.tsx`
- `app/error.tsx` — root error boundary with "Try again" reset button (shadcn `Button`)

### Existing `loading.tsx` files (already present from prior phases)
appointments, assessments, chat-history, documents, journey, leaderboard, mindful-minutes, new-chat, packages, prescriptions, self-journaling, stress-management, wellness-resources, find-therapist

---

## 6. Known Remaining Issues

- **ESLint full scan not run** — permission denied in this session. Run manually: `pnpm eslint . --ext .ts,.tsx --max-warnings 50`
- **Middleware deprecation** — Next.js 16 recommends `proxy` over `middleware`. Non-blocking for now.
- **`@capacitor-community/razorpay` not installed** — type declaration in `types/vendor.d.ts` resolves TypeScript, but the native plugin must be added to `package.json` before shipping to app stores.

---

## 7. Next Steps

1. **Run ESLint manually** and address any critical errors
2. **Manual testing** — login flow, payment flow, analytics events in Firebase DebugView
3. **`cap sync`** after Phase 11 Capacitor hardening is merged
4. **Add `analytics-initializer` to journey/assessment pages** for per-screen analytics via `trackScreenView`
5. **Wire `trackAppointmentBooked` / `trackPaymentCompleted`** in checkout/booking pages using `useAnalytics()` hook
