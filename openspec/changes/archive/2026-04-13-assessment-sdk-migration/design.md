## Context

The assessment feature spans multiple pages under `app/(auth)/assessments/` — a landing page with browse/assigned tabs, a details page, a question flow page, and an analysis/report page. Data fetching is currently split across:

- `hooks/use-assessments.ts` — SWR infinite for browsing, SWR for by-id, plus `mapStrapiAssessment` mapping
- `hooks/use-assigned-assessments.ts` — SWR wrapper around Firebase Firestore reads
- `services/assessment.service.ts` — Firebase reads for assigned assessments and completion checks
- Inline SWR in `assessments/page.tsx` — filtered search calls `getApiV1Assessments` directly
- Inline Firebase reads in `[id]/analysis/page.tsx` — submission history fetching
- Direct `backendClient.post` in `[id]/page.tsx` — assessment submission saving

UI components for assessments are split between `components/appointments/` (cards, skeletons, empty states, categories, assignments list) and `components/assessment/` (question renderer, answer selectors). The `appointments/` location is wrong — these are assessment-specific, not appointment-specific.

## Goals / Non-Goals

**Goals:**
- Single `hooks/use-assessments.ts` file exporting all assessment-related hooks and data manipulation functions
- All Strapi API calls go through the SDK (`getApiV1Assessments`, `getApiV1AssessmentsById`)
- All assessment UI components co-located under `components/assessment/`
- Assessment pages match the provided reference designs
- Data manipulation logic (mapping, filtering, categorization) lives in the hook file, not in page components

**Non-Goals:**
- Changing backend APIs or Strapi schema
- Migrating Firebase (Firestore for assignments, RTDB for submissions) to a different store
- Modifying the Strapi SDK itself
- Touching non-assessment features (journeys, worksheets, etc.)

## Decisions

### 1. Single hook file with multiple exported hooks

**Decision**: Keep one `hooks/use-assessments.ts` file that exports `useAssessments`, `useAssessmentById`, `useAssignedAssessments`, `useAssessmentSubmissions`, `useFilteredAssessments`, plus helper functions like `mapStrapiAssessment` and `categorizeAssessments`.

**Rationale**: The user explicitly requested consolidating all assessment data fetching and manipulation into one hook. A single file keeps related logic together. The file is ~200 lines which is manageable. Individual hooks are still tree-shakeable since they're named exports.

**Alternative considered**: Separate hooks per concern (browse, assigned, submissions). Rejected because the user wants consolidation, and these hooks share types and mapping logic.

### 2. Move assessment components from `components/appointments/` to `components/assessment/`

**Decision**: Move `assessment-card.tsx`, `assessment-skeletons.tsx`, `assessment-empty-state.tsx`, `assessment-category.ts`, `assignments-list.tsx` from `components/appointments/` to `components/assessment/`. Update all imports.

**Rationale**: Follows the project's feature-based co-location convention. Assessment components belong under `components/assessment/`, not `components/appointments/`.

### 3. Keep Firebase for assigned assessments and submissions

**Decision**: Firebase Firestore (assigned assessments) and Firebase RTDB (submission history) stay as-is. The hook wraps these reads in SWR for caching consistency.

**Rationale**: These are not Strapi-backed. The Strapi SDK only covers the assessment catalog. Assigned assessments come from Firestore `patient_assignments` collection, and submissions are stored in RTDB under `assessments/{leadId}/{assessmentId}`.

### 4. Assessment submission via hook-exported function

**Decision**: Export a `submitAssessment(leadId, assessmentId, answers)` function from the hook file that handles both Firebase RTDB push and backend POST. Page component calls this function instead of doing raw Firebase + backendClient calls.

**Rationale**: Centralizes the dual-write logic (Firebase + backend) in one place. The page component becomes purely UI.

### 5. Route structure stays under `app/(auth)/assessments/[id]/`

**Decision**: Keep the current route structure. Details page uses `app/(auth)/assessments/[id]/details/page.tsx` with `id` as a path param (not query param). Question flow is `app/(auth)/assessments/[id]/page.tsx`. Analysis is `app/(auth)/assessments/[id]/analysis/page.tsx`.

**Rationale**: Path params are cleaner than query params. The current structure already uses `[id]` — just need to update the details page to use the path param instead of `?id=` query param.

## Risks / Trade-offs

- **Risk**: Moving components changes import paths across multiple files → **Mitigation**: Update all imports in a single task, grep to verify no broken imports remain.
- **Risk**: Consolidating hooks into one file could make it large → **Mitigation**: The file stays under ~250 lines. If it grows, individual hooks can be extracted later.
- **Risk**: Changing details page from query param (`?id=`) to path param (`[id]/details`) breaks existing deep links → **Mitigation**: All navigation is internal (router.push), no external links exist. Update all router.push calls in the same task.
- **Trade-off**: Keeping Firebase alongside SDK means two data sources in one hook file. This is acceptable because they serve different purposes (catalog vs. user-specific data).
