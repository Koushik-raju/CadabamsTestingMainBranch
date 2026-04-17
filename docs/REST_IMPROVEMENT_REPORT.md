<!--
FILE: docs/REST_IMPROVEMENT_REPORT.md

PURPOSE:
  Audit report cataloguing inefficient REST query patterns, SWR misuse,
  and SDK-rule violations across the cadabams-consult-frontend codebase.
  Each finding includes location, severity, root cause and suggested fix.

LOGIC OVERVIEW:
  Generated from a parallel audit of `hooks/` (SWR layer) and
  `app/(auth)/` (page layer). Findings are grouped by category and
  ordered by severity. A prioritized action plan closes the report.

LAST UPDATED: 2026-04-17 — initial report.
-->

# REST Query Improvement Report

**Date:** 2026-04-17
**Scope:** `hooks/**`, `app/(auth)/**`
**Methodology:** Parallel sub-agent audits — one over the SWR hook layer, one over the page layer. Findings cross-referenced against the project's API & SDK Rules in `CLAUDE.md`.

---

## Executive Summary

| Category | Count | Highest severity |
|---|---|---|
| Stale cache after mutation | 3 | HIGH |
| List-endpoint-for-single-item | 1 | HIGH |
| Improper / unstable SWR keys | 2 | HIGH |
| Raw `fetch()` bypassing the SDK | 2 | HIGH |
| Pages calling SDK directly (rule #4 / #7 violation) | 3 | MEDIUM |
| Client-side filtering of server lists | 2 | MEDIUM |
| Duplicate hooks for the same endpoint | 1 | MEDIUM |
| Missing conditional fetch (key not gated on id) | 3 | MEDIUM |
| Over-fetching nested payloads for list views | 1 | MEDIUM |
| Non-SWR `useEffect` data fetching | 2 | MEDIUM |
| Type casts hiding shape mismatches (rule #5) | 2 | MEDIUM |
| Missing pagination / unbounded `limit` | 2 | LOW |
| SDK types imported in pages | 3 | LOW |

**Total: 27 findings** — 7 HIGH, 13 MEDIUM, 7 LOW.

The codebase generally follows the SWR pattern correctly. The biggest risks are (a) **mutations not invalidating their related caches**, leaving the UI stale after booking/submitting, and (b) a small set of pages and hooks that still **bypass the SDK or the hook layer**.

---

## HIGH severity

### H1. List endpoint used to read a single appointment
**File:** `hooks/appointments/use-appointments-page.ts:74-105` — `useAppointmentById()`
Fetches the entire appointments list via `crmControllerFetchAppointmentDetails()` then `.find(a => a.id === id)`. Pulls 1+ year of data to read one row.
**Fix:** Use the dedicated `crmControllerGetAppointmentById` (or equivalent). If it does not exist, flag to backend per SDK rule #8 — do not work around it.

### H2. Booking mutation does not invalidate slots
**File:** `hooks/consult/use-checkout.ts:34-69` — `bookAndPay()`
After `crmControllerBookAppointment` + `crmControllerRazorpayPayment`, no `mutate(slotsKey(doctorId, consultationTypeId))` is fired. The slot the user just consumed is still shown as available.
**Fix:** `await globalMutate(slotsKey(doctorId, consultationTypeId))` (and `appointmentsKey(leadId)`) on success.

### H3. Package booking does not invalidate package lists
**File:** `hooks/packages/use-packages.ts:72-94` — `bookPackage()`, `initiatePackagePayment()`
Mutations don't refresh `managedPackagesKey()` / `availablePackagesKey()`. User's "My Packages" stays stale until manual reload.
**Fix:** `globalMutate` both keys after successful payment confirmation.

### H4. Assessment submission does not invalidate submission list
**File:** `hooks/assessments/use-assessment-detail.ts:142-166` — `submitAssessment()`
Calls `patientAssessmentsControllerCreateCompletion` without invalidating `assessmentSubmissionsKey(leadId, assessmentId)`. Past attempts list is stale.
**Fix:** `globalMutate(assessmentSubmissionsKey(leadId, assessmentId))` on success.

### H5. Leaderboard SWR key collisions across param sets
**File:** `hooks/leaderboard/use-leaderboard.ts:25-32`
Key is the static string `'leaderboard'` while the fetcher reads `params` from closure. Two concurrent mounts with different params overwrite each other in the cache.
**Fix:** `params ? ['leaderboard', JSON.stringify(params)] : 'leaderboard'`.

### H6. Raw `fetch()` for journey data — `selected-package`
**File:** `app/(auth)/packages/selected-package/page.tsx:89-106`
A raw `fetch(${JOURNEY_BASE_URL}/${journeyId})` runs in a `useEffect`. Violates SDK rule #4 (no raw fetch) and bypasses the SWR cache + revalidation lifecycle.

### H7. Raw `fetch()` for journey data — `book/[package_id]`
**File:** `app/(auth)/packages/book/[package_id]/page.tsx:87-104`
Identical raw `fetch()` block, duplicated. Same violation as H6.
**Fix (H6 + H7):** Add `crmController…` for journey detail (or escalate per rule #4) and wrap in a shared `useJourneyDetail(journeyId)` SWR hook. Replace both `useEffect` blocks.

---

## MEDIUM severity

### M1. Pages calling SDK directly — booking
**File:** `app/(auth)/consult/booking/[doctor_id]/page.tsx:110-130`
Inline `useEffect` calls `crmControllerGetDoctorById` and `crmControllerGetCampuses` although `useBookingDoctor()` and `useBookingCampuses()` exist in `hooks/consult/use-booking.ts`. Violates rule #7.
**Fix:** Replace with the existing hooks.

### M2. Pages calling SDK directly — checkout
**File:** `app/(auth)/consult/checkout/page.tsx:89-98`
`Promise.all([crmControllerGetDoctorById(...), crmControllerGetSlotPrice(...)])` instead of `useCheckoutDoctor` / `useCheckoutSlotPrice`.
**Fix:** Switch to hooks.

### M3. Pages calling SDK directly — profile
**File:** `app/(auth)/profile/page.tsx:99-102`
Inline `useSWR(..., () => crmControllerGetAppointmentDashboard(...))`. Duplicates the home-page fetch under a different key.
**Fix:** Use `useAppointments()`.

### M4. Client-side filter on assessments — `citationText`
**File:** `hooks/assessments/use-assessments-page.ts:254-281`
Fetches `limit: 100`, then `.filter(item => item.citationText != null)`. Server should filter.
**Fix:** Pass a `citationText` / status param.

### M5. Client-side filter on assessments — category
**File:** `hooks/assessments/use-assessments-page.ts:283-328`
Same hook does category filtering in JS after fetching all items.
**Fix:** Pass `category` to the SDK call; let the server filter.

### M6. Duplicate hook for `getPackageProductDetails`
**Files:** `hooks/packages/use-packages.ts:59-68` (`usePackageProductDetails`) **and** `hooks/packages/use-package-detail.ts:6-15` (`usePackageDetail`)
Same SDK call, two SWR keys (`packageProductDetailsKey` vs `packageByIdKey`) — defeats deduping; both pay the network cost.
**Fix:** Collapse into one hook + key; update consumers.

### M7. Missing conditional fetching — `usePackageProductLines`
**File:** `hooks/packages/use-packages.ts:46-57`
Key is built unconditionally even when `packageId` is undefined.
**Fix:** Key = `packageId ? packageProductLinesKey(packageId) : null`.

### M8. Missing conditional fetching + non-SWR — `useAppointments`
**File:** `hooks/appointments/use-appointments-page.ts:23-72`
Uses `useState` + `useEffect` rather than SWR; no deduping, no cache, fires even when `leadId` is undefined.
**Fix:** Migrate to `useSWR(leadId ? appointmentsKey(leadId) : null, fetcher)`.

### M9. Non-SWR fetch — onboarding relationships
**File:** `app/(auth)/onboarding/page.tsx:85-89`
`crmControllerGetRelationships()` called inside `useEffect`. No cache reuse across pages.
**Fix:** Wrap in `useRelationships()` hook in `hooks/shared/`.

### M10. Over-fetching nested payloads — wellness list
**File:** `hooks/wellness/use-wellness-resources.ts:12-35`
List view receives `similarBlogs[]` and full `text: ResourceBlock[]` for every row but renders only title/image/category.
**Fix:** Request a summary projection (e.g. `?fields=...`) or split list / detail DTOs at the SDK level.

### M11. Type-cast chains hiding shape — `selected-package`
**File:** `app/(auth)/packages/selected-package/page.tsx:85-87`
`(pkg as Record<string, unknown>)?.journey_document_id as string | null …` — violates rule #5 (no `as` casts) and rule #8 (flag SDK gaps, don't paper over them).
**Fix:** Identify the actual missing field (`journey_document_id`?) and request an SDK update.

### M12. Type-cast chains hiding shape — `book/[package_id]`
**File:** `app/(auth)/packages/book/[package_id]/page.tsx:84-85`
Same anti-pattern as M11.
**Fix:** Same as M11 — fix in one place once the SDK exposes the field cleanly.

### M13. `revalidateOnFocus` not configured on infinite list
**File:** `hooks/wellness/use-wellness-resources.ts:46-112`
`useSWRInfinite` has no `revalidateOnFocus: false` / `errorRetryCount`. Risk of duplicated page loads if the user backgrounds and refocuses mid-scroll.
**Fix:** Pass an SWRInfinite config with these defaults.

---

## LOW severity

### L1. Hardcoded `limit: 50` for journaling categories
**File:** `hooks/use-journaling.ts:61-67` — assumes <50 categories forever.
**Fix:** Confirm with backend or paginate.

### L2. Filtered-assessments key uses empty-string defaults
**File:** `hooks/assessments/use-assessments-page.ts:283-293`
`['filtered', '', '']` collisions are harmless today but make future debugging harder.
**Fix:** Early-return when both filters are empty, or omit them from the key.

### L3-L5. SDK types imported by pages
- `app/(auth)/prescriptions/page.tsx:37` → `PrescriptionItemDto`
- `app/(auth)/packages/page.tsx:25` → `BookedPackageDto`
- `app/(auth)/packages/[id]/page.tsx:32` → `BookedPackageLineDto`

Not strictly forbidden (rule #2 says **import from SDK**, never define manually), but co-locating with the hook makes the page tier insulated from SDK regenerations. Re-export from the corresponding hook file.

### L6. `WellnessResource` interface defined in hook duplicates SDK type
**File:** `hooks/wellness/use-wellness-resources.ts:12-35`
Local interface for shapes that should come from the SDK. Violates rule #2.
**Fix:** Import the generated DTO; delete the local interface.

### L7. No retry/backoff on SWRInfinite paginated wellness
Already noted in M13 as the cache-config piece; the retry side is the LOW half.

---

## Findings NOT detected

These anti-patterns were searched for and **not** found, which is worth recording:

- N+1 fetch loops (list → one detail call per row).
- Sequential `await` chains in pages where parallel `Promise.all` would do.
- Pages destructuring fields from a hook then never rendering them.
- Pages fetching a parent resource purely to derive an id already in URL params.
- `useEffect` data fetching in pages (apart from those listed above).

---

## Recommended action plan

**Sprint 1 — correctness (HIGH):**
1. Add `mutate()` calls to `bookAndPay`, `bookPackage`, `initiatePackagePayment`, `submitAssessment` (H2, H3, H4).
2. Stabilise the leaderboard SWR key (H5).
3. Replace `useAppointmentById`'s list-then-find with a real detail endpoint or escalate to backend (H1).
4. Replace the two raw `fetch()` journey loaders with a single `useJourneyDetail` SWR hook backed by an SDK function (H6, H7) — escalate if the SDK is missing it.

**Sprint 2 — hygiene (MEDIUM):**
5. Migrate the three pages still calling `crmController*` directly to existing hooks (M1-M3).
6. Push assessment filters to the server (M4, M5).
7. Collapse the duplicate package-detail hooks (M6).
8. Gate undefined ids in SWR keys (M7).
9. Move `useAppointments` and `useRelationships` to SWR (M8, M9).
10. Eliminate `as Record<string, unknown>` casts; raise SDK gap with backend (M11, M12).

**Sprint 3 — polish (LOW):**
11. Re-export SDK DTOs from hook files; drop hand-written interfaces (L3-L6).
12. Configure `revalidateOnFocus`/retry on the wellness infinite hook (M13/L7).
13. Verify the journaling `limit: 50` assumption with the backend (L1).

---

## Appendix — files touched by this audit

```
hooks/appointments/use-appointments-page.ts
hooks/assessments/use-assessment-detail.ts
hooks/assessments/use-assessments-page.ts
hooks/consult/use-checkout.ts
hooks/leaderboard/use-leaderboard.ts
hooks/packages/use-package-detail.ts
hooks/packages/use-packages.ts
hooks/use-journaling.ts
hooks/wellness/use-wellness-resources.ts
app/(auth)/consult/booking/[doctor_id]/page.tsx
app/(auth)/consult/checkout/page.tsx
app/(auth)/onboarding/page.tsx
app/(auth)/packages/[id]/page.tsx
app/(auth)/packages/book/[package_id]/page.tsx
app/(auth)/packages/page.tsx
app/(auth)/packages/selected-package/page.tsx
app/(auth)/prescriptions/page.tsx
app/(auth)/profile/page.tsx
```
