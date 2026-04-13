## Why

The assessment feature currently mixes direct API calls (`backendClient.post`, `getApiV1Assessments` inline in pages), Firebase reads, and service-layer functions across multiple files. Data fetching logic is scattered between `hooks/use-assessments.ts`, `hooks/use-assigned-assessments.ts`, `services/assessment.service.ts`, and inline SWR calls in page components. This makes the code harder to maintain, test, and extend. Additionally, the assessment UI pages (details, question flow, completion, report) need to match updated reference designs and should use components co-located under `components/assessment/` with shared components from `components/shared/`.

## What Changes

- **Consolidate all assessment data fetching into a single `hooks/use-assessments.ts` hook** — merge `useAssessments`, `useAssessmentById`, `useAssignedAssessments`, submission fetching, and filtered search into one unified hook file. All SDK calls go through the Strapi SDK (`getApiV1Assessments`, `getApiV1AssessmentsById`). Firebase reads for assigned assessments and submission history stay but are encapsulated in the same hook file.
- **Remove `hooks/use-assigned-assessments.ts`** — its logic moves into the consolidated hook.
- **Remove direct `backendClient.post` / `endpoints.saveAssessment` calls from page components** — submission saving moves into a hook-exported function or the consolidated hook.
- **Migrate `components/appointments/assessment-*.tsx` to `components/assessment/`** — assessment cards, skeletons, empty states, category config, and assignments list move from `components/appointments/` to `components/assessment/` following feature-based co-location conventions.
- **Rebuild assessment detail pages to match reference designs**:
  - Details page: clinically validated badge, title, description, duration/question count stats, benefit points, "Start Assessment" CTA (matches `assessments-details-page.png`)
  - Question flow: progress bar, MCQ with icon+checkmark selection, multi-question dropdown with bottom sheet picker (matches `mcq-type-question.png`, `multi-question-drop-down.png`, `multi-question-drop-down-2.png`)
  - Completion page: checkmark icon, "Assessment Complete" message, AI disclaimer, "Generate Report" CTA (matches `assessment-complete-page.png`)
  - Report page: AI-generated summary badge, narrative text results, "Book appointment with a specialist" CTA (matches `assessment-report-page.png`)
- **Update route structure** — all assessment pages live under `app/(auth)/assessments/[id]/` (details, questions, analysis). Remove old `app/(public)/assessment/` routes.

## Capabilities

### New Capabilities
- `assessment-data-hook`: Unified SWR hook consolidating all assessment data fetching (browse, by-id, assigned, submissions, filtered search) using the Strapi SDK
- `assessment-ui-components`: Co-located assessment UI components under `components/assessment/` — cards, skeletons, empty states, category config, assignments list
- `assessment-detail-pages`: Rebuilt assessment pages (details, question flow, completion, report) matching reference designs

### Modified Capabilities

## Impact

- **Files removed**: `hooks/use-assigned-assessments.ts`, `components/appointments/assessment-*.tsx` (moved), old public assessment routes
- **Files modified**: `hooks/use-assessments.ts` (expanded), `app/(auth)/assessments/page.tsx` (updated imports), `app/(auth)/assessments/[id]/page.tsx`, `app/(auth)/assessments/[id]/details/page.tsx`, `app/(auth)/assessments/[id]/analysis/page.tsx`
- **Files created**: New components under `components/assessment/`
- **Dependencies**: No new dependencies. Continues using SWR, Strapi SDK, Firebase
- **APIs**: No backend API changes. All changes are frontend data-fetching and UI
