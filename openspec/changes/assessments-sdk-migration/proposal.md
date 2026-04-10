## Why

Assessment pages scatter API calls across raw `fetch`, `axios`, and `firebase/database` reads with no consistent data-fetching layer, making the code hard to maintain and leaving users with no optimistic caching or stale-while-revalidate behaviour. Consolidating everything onto the Strapi SDK + SWR eliminates duplicated request logic, gives instant cache hits on revisit, and makes all UI fully reactive to live data without any static fallbacks.

## What Changes

- **Migrate all GET calls** in assessment pages from raw `fetch`/`axios` to `getApiV1Assessments` and `getApiV1AssessmentsById` from `sdk/strapi/index.ts`
- **Replace `useEffect` + `useState` data-fetching** with `useSWR` hooks throughout assessment pages
- **Consolidate** `app/(auth)/assessments/[slug]/page.tsx` (detail + questions flow) and `app/(public)/assessment/[id]/page.tsx` (form flow) — both do the same job; keep one canonical route at `app/(public)/assessment/[id]/page.tsx` using the SDK
- **Rewrite** `app/(auth)/assessments/page.tsx` — the landing/browse page — to fetch all available assessments via SDK + SWR with search and category filters driven by API data (no hardcoded `ASSESSMENT_DEFINITIONS`)
- **Delete** `app/(auth)/assessments/constants.ts` static definition list (replaces with dynamic data)
- **Rewrite** `app/(public)/assessment/details/page.tsx` — assessment intro/details page — using SDK + SWR
- **Rewrite** `app/(public)/assessment/analysis/page.tsx` — history/results page — keeping Firebase read for submission history but wrapping in SWR
- **Update** `app/(auth)/assessments/[slug]/questions/page.tsx` if it exists, to use SDK
- Make assigned-assessments tab dynamic via existing Firebase Firestore service (no SDK change needed there — already correct)
- Add category filter chips populated from API response data, not hardcoded constants
- All loading states use skeleton UI; error states show recoverable error messages
- **BREAKING**: removes `app/(auth)/assessments/constants.ts` static data — any page importing `ASSESSMENT_DEFINITIONS` must switch to API data

## Capabilities

### New Capabilities

- `assessment-browse`: Paginated, filterable list of all available assessments fetched from Strapi SDK with SWR; search + category filters; featured/popular/growth grouping driven by API fields; assigned-assessments tab; no static data
- `assessment-detail`: Assessment intro/detail page (image, title, duration, question count, highlights) fetched via `getApiV1AssessmentsById` + SWR; completion status from Firebase; start/retake CTA
- `assessment-form`: Step-by-step question flow using SDK to load questions; progress bar; per-question answer state; submit to Firebase + backend; completion screen with report prompt matching reference UI
- `assessment-report`: Post-submission analysis/history page showing past submission cards from Firebase, with retake and appointment booking CTA matching reference UI

### Modified Capabilities

## Impact

- **Files changed**: `app/(auth)/assessments/page.tsx`, `app/(auth)/assessments/[slug]/page.tsx`, `app/(auth)/assessments/[slug]/questions/page.tsx`, `app/(public)/assessment/[id]/page.tsx`, `app/(public)/assessment/details/page.tsx`, `app/(public)/assessment/analysis/page.tsx`
- **Files deleted**: `app/(auth)/assessments/constants.ts`, `app/(public)/assessment/page.tsx`, `app/(public)/assessment/form/page.tsx`
- **Dependencies added**: `swr` (if not already installed)
- **SDK used**: `sdk/strapi/index.ts` — `getApiV1Assessments`, `getApiV1AssessmentsById`
- **Firebase**: Firestore (`patient_assignments`) for assigned items; Realtime DB (`assessments/{leadId}/{id}`) for submission history — unchanged
- **Types**: `types/assessment.ts` types remain; SDK response types may need mapping helpers
