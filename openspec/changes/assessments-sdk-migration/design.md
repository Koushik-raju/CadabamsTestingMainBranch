## Context

The assessment feature spans two route groups (`app/(auth)/assessments` and `app/(public)/assessment`) with overlapping responsibilities and inconsistent data-fetching:

- `app/(auth)/assessments/page.tsx`: browse + assigned tabs, uses raw `fetch` with `useEffect`/`useState`
- `app/(auth)/assessments/[slug]/page.tsx`: detail + question flow, uses raw `fetch`
- `app/(auth)/assessments/constants.ts`: large static `ASSESSMENT_DEFINITIONS` array that duplicates backend data
- `app/(public)/assessment/[id]/page.tsx`: question form, already imports `getApiV1AssessmentsById` from SDK but wraps in `useEffect`
- `app/(public)/assessment/details/page.tsx`: detail intro page, uses raw `axios` call
- `app/(public)/assessment/analysis/page.tsx`: history page, reads directly from Firebase Realtime DB

The Strapi SDK (`sdk/strapi/index.ts`) exposes `getApiV1Assessments` and `getApiV1AssessmentsById` — typed, centralised, and backed by a preconfigured client. SWR provides stale-while-revalidate caching, deduplication, and automatic revalidation on focus.

## Goals / Non-Goals

**Goals:**
- All GET data fetching for assessments goes through `getApiV1Assessments` / `getApiV1AssessmentsById` from `sdk/strapi/index.ts`
- All fetches wrapped with `useSWR` — no bare `useEffect`+`useState` data-loading
- Landing page (`app/(auth)/assessments/page.tsx`) shows: browse tab (all available), assigned assessments tab, with search + category filters driven by API response
- Detail page shows API-driven metadata (image, title, duration, question count, highlights from `landingTitle.points`)
- Form page shows API-driven questions, submit to Firebase + backend, completion screen → report CTA
- Report/analysis page shows Firebase submission history, "Book appointment" CTA
- UI matches reference images: dark recommended card, list rows with icon, orange accent CTA buttons
- Remove `constants.ts` static data
- Consolidate duplicate routes (one canonical detail route, one canonical form route)

**Non-Goals:**
- POST/PATCH/DELETE API operations (out of scope for this change)
- Worksheet tab rewrite (existing `WorksheetCard` component + service already works)
- Authentication/session changes
- AI-generated report text (report page shows submission history only; "Generate Report" CTA is a placeholder button)
- New backend endpoints — only consume existing Strapi SDK endpoints

## Decisions

### 1. SWR fetcher wrapping the SDK function

**Decision**: Create thin SWR fetcher functions that call the Strapi SDK and extract `.data`:

```ts
// hooks/use-assessments.ts
import useSWR from 'swr';
import { getApiV1Assessments, getApiV1AssessmentsById } from '@/sdk/strapi';

const fetchAssessments = (query: { limit: number; offset: number }) =>
  getApiV1Assessments({ query }).then((r) => r.data);

export function useAssessments(params: { limit: number; offset: number }) {
  return useSWR(['assessments', params], () => fetchAssessments(params));
}

export function useAssessmentById(id: string | null) {
  return useSWR(id ? ['assessment', id] : null, () =>
    getApiV1AssessmentsById({ path: { id: id! } }).then((r) => r.data)
  );
}
```

**Why over raw fetch**: SDK handles base URL, headers, and typing. SWR handles deduplication, caching, and loading/error states without boilerplate.

**Alternative considered**: React Query — heavier bundle, not already in project.

### 2. Pagination strategy: infinite scroll via SWR `useSWRInfinite`

**Decision**: Use `useSWRInfinite` for the browse tab with page size of 10, appending pages as the user scrolls to the bottom.

**Why**: Matches existing UX (scroll to load more) but removes manual `offset` state + append logic.

### 3. Route consolidation

**Decision**: Keep `app/(public)/assessment/[id]/page.tsx` as the canonical form/question route (it already uses the SDK). Delete `app/(auth)/assessments/[slug]/page.tsx` (duplicate). The detail/intro page stays at `app/(public)/assessment/details/page.tsx` (rewritten with SDK + SWR). The browse/landing page stays at `app/(auth)/assessments/page.tsx`.

**Why**: Minimal routing disruption. Internal links already point to `/assessment/[id]` for the form.

### 4. Category filters from API data

**Decision**: Derive category filter chips from the union of `category[]` arrays across fetched assessments (deduplicated), prepended with an "All" chip. Remove hardcoded `ASSESSMENT_CATEGORIES` constant.

**Why**: Filters stay in sync with what the API actually returns — no stale static list.

### 5. Featured / Popular / Growth grouping

**Decision**: Use simple heuristic: first item in the list = "Recommended" featured card; items with `category` containing anxiety/depression/sleep = "Popular Screenings"; remaining = "Personal Growth". This avoids needing a new backend field while matching the reference UI layout.

**Why**: The backend doesn't expose a `section` field; this mirrors what the existing page already does.

### 6. Assigned assessments — keep Firebase Firestore service

**Decision**: `services/assessment.service.ts` (`getAssignedAssessments`, `getAssignedWorksheets`) reads from Firestore `patient_assignments` — leave this unchanged. Wrap calls in SWR using a custom fetcher.

**Why**: Assigned items are stored in Firestore, not Strapi. The service is correct and already tested.

## Risks / Trade-offs

- **SDK type mismatch**: SDK types are auto-generated; field names may differ slightly from current `AssessmentItem` type (e.g. `label` vs `title`). Mitigation: add a `mapStrapiAssessment` adapter to normalise the response before use.
- **`useSWRInfinite` complexity**: Infinite scroll with SWR requires careful key construction to avoid refetch storms. Mitigation: stable key function with `[page, filters]` tuple.
- **Firebase still required for submission history**: The analysis/report page still reads from Firebase Realtime DB — this is intentional (submissions are stored there). If Firebase is deprecated later, this is a separate migration.
- **Route deletion**: Removing `app/(auth)/assessments/[slug]/page.tsx` may break existing links if any pages deep-link there with a slug. Mitigation: add a redirect from the old slug route to `/assessment/[id]` during the task.

## Migration Plan

1. Install `swr` if not present (`npm install swr`)
2. Create `hooks/use-assessments.ts` with SWR hooks
3. Rewrite pages one at a time (browse → detail → form → report)
4. Delete static `constants.ts` and dead routes after all pages are migrated
5. Verify navigation links across the app point to correct routes
6. No backend changes needed — rollback is a git revert of client files only

## Open Questions

- Does `getApiV1Assessments` support `?status=PUBLISHED` query param for filtering, or must filtering happen client-side? (Current page filters `item.status === 'PUBLISHED'` client-side — assume same approach until confirmed.)
- Should the "Generate Report" CTA on the completion screen trigger a real AI endpoint, or remain a placeholder? (Assumed placeholder for this change.)
