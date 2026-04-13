## 1. Consolidated Assessment Hook

- [x] 1.1 Expand `hooks/use-assessments.ts` — add `useAssignedAssessments` (move logic from `hooks/use-assigned-assessments.ts` and `services/assessment.service.ts` Firebase reads), `useAssessmentSubmissions` (move Firebase RTDB submission fetching from analysis page), `useFilteredAssessments` (move inline SWR search from assessments landing page), and `submitAssessment` function (move Firebase push + backendClient.post from question flow page)
- [x] 1.2 Add `categorizeAssessments` helper to the hook — extract the `recommendedAssessment` / `popularScreenings` / `personalGrowth` categorization logic currently inline in `assessments/page.tsx`
- [x] 1.3 Delete `hooks/use-assigned-assessments.ts` and update all imports to use `useAssignedAssessments` from `hooks/use-assessments.ts`
- [x] 1.4 Verify no remaining direct `backendClient` or `endpoints.saveAssessment` imports in assessment page files

## 2. Move Assessment Components

- [x] 2.1 Move `components/appointments/assessment-card.tsx` → `components/assessment/assessment-card.tsx`, update internal imports (e.g., `getCategoryInfo` path)
- [x] 2.2 Move `components/appointments/assessment-skeletons.tsx` → `components/assessment/assessment-skeletons.tsx`
- [x] 2.3 Move `components/appointments/assessment-empty-state.tsx` → `components/assessment/assessment-empty-state.tsx`
- [x] 2.4 Move `components/appointments/assessment-category.ts` → `components/assessment/assessment-category.ts`
- [x] 2.5 Move `components/appointments/assignments-list.tsx` → `components/assessment/assignments-list.tsx`
- [x] 2.6 Update all imports in `app/(auth)/assessments/page.tsx` to reference `components/assessment/` instead of `components/appointments/`
- [x] 2.7 Grep for any remaining imports from `components/appointments/assessment-*` and fix them

## 3. Assessment Details Page

- [x] 3.1 Rebuild `app/(auth)/assessments/[id]/details/page.tsx` to use path param `id` instead of `?id=` query param, use `useAssessmentById` from consolidated hook
- [x] 3.2 Match reference design: back button, "Clinically Validated" badge, title, description, stats row (duration + question count with icons), benefit points list with checkmark icons, privacy note at bottom
- [x] 3.3 Add full-width orange "Start Assessment →" CTA that navigates to `/assessments/{id}`
- [x] 3.4 Update all `router.push` calls that navigate to assessment details (in landing page, cards) to use `/assessments/{id}/details` path instead of `/assessment/details?id=`

## 4. Question Flow Page

- [x] 4.1 Update `app/(auth)/assessments/[id]/page.tsx` to use `submitAssessment` from consolidated hook — remove direct `backendClient`, `endpoints`, Firebase `push`/`ref` imports
- [x] 4.2 Update MCQ renderer in `components/assessment/answer-selectors/mcq.tsx` to match reference: card rows with icon, label, and circular radio indicator; selected state with orange border and filled checkmark
- [x] 4.3 Add multi-question dropdown question type — render multiple sub-questions each with a "Select an option" trigger that opens a bottom sheet picker with radio options (matches `multi-question-drop-down.png` reference)
- [x] 4.4 Update progress bar styling: orange fill, step counter text visible in header area
- [x] 4.5 Update completion screen (inline in question flow page): orange 100% progress bar, checkmark in orange circle, "Assessment Complete" heading, AI disclaimer card, "GENERATE REPORT →" CTA navigating to `/assessments/{id}/analysis`

## 5. Assessment Report Page

- [x] 5.1 Update `app/(auth)/assessments/[id]/analysis/page.tsx` to use `useAssessmentSubmissions` from consolidated hook — remove inline Firebase fetching
- [x] 5.2 Match reference design: close button (X), "Assessment Report" header, "AI-generated summary" badge, narrative text with bold highlights for key findings, AI disclaimer at bottom
- [x] 5.3 Add "Book appointment with a specialist" full-width orange CTA button
- [x] 5.4 Handle empty state: show "Take Assessment" CTA when no submissions exist

## 6. Landing Page Cleanup

- [x] 6.1 Update `app/(auth)/assessments/page.tsx` to use `useFilteredAssessments` and `categorizeAssessments` from hook — remove inline SWR call and inline categorization logic
- [x] 6.2 Update all navigation paths: `router.push` to details should use `/assessments/{id}/details`, to assessment flow should use `/assessments/{id}`, to analysis should use `/assessments/{id}/analysis`
- [x] 6.3 Verify all component imports point to `components/assessment/` not `components/appointments/`

## 7. Cleanup & Verification

- [x] 7.1 Delete old public assessment routes if they still exist: `app/(public)/assessment/[id]/page.tsx`, `app/(public)/assessment/analysis/page.tsx`, `app/(public)/assessment/details/page.tsx`
- [x] 7.2 Run build (`next build`) and fix any TypeScript or import errors
- [x] 7.3 Grep entire codebase for `components/appointments/assessment` and `hooks/use-assigned-assessments` — verify zero results
