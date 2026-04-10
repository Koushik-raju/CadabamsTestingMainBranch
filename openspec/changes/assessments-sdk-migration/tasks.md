## 1. Setup & Foundation

- [x] 1.1 Confirm `swr` is in `package.json`; install if missing (`npm install swr`)
- [x] 1.2 Create `hooks/use-assessments.ts` with `useAssessments` (`useSWRInfinite` wrapper around `getApiV1Assessments`) and `useAssessmentById` (`useSWR` wrapper around `getApiV1AssessmentsById`)
- [x] 1.3 Create `hooks/use-assigned-assessments.ts` wrapping `getAssignedAssessments(leadId)` in `useSWR` keyed by `['assigned-assessments', leadId]`
- [x] 1.4 Add a `mapStrapiAssessment` adapter in `hooks/use-assessments.ts` that normalises SDK response fields to the shape consumed by UI components (handling `label` vs `title`, nested `landingTitle`, etc.)

## 2. Delete Dead Code & Consolidate Routes

- [x] 2.1 Delete `app/(public)/assessment/page.tsx` (redirect-only, no longer needed)
- [x] 2.2 Delete `app/(public)/assessment/form/page.tsx` (replaced by `app/(public)/assessment/[id]/page.tsx`)
- [x] 2.3 Delete `app/(auth)/assessments/[slug]/page.tsx` (duplicate detail+question flow)
- [x] 2.4 Delete `app/(auth)/assessments/[slug]/questions/page.tsx` if it exists and has no remaining callers
- [x] 2.5 Delete `app/(auth)/stress-management/assessment/page.tsx` (already marked deleted in git status)
- [x] 2.6 Delete `app/(auth)/assessments/constants.ts` (`ASSESSMENT_DEFINITIONS`, stress option arrays — all static data replaced by API)
- [x] 2.7 Run `tsc --noEmit` and fix any import errors caused by the deletions above

## 3. SDK Type Migration

- [ ] 3.1 Audit all assessment-related files for locally defined interfaces that shadow Strapi response shapes (`ApiAssessmentsResponse`, `AssessmentDetail`, `AssessmentData`, `AssessmentDetailResponse`, `AssessmentListResponse`, inline interfaces in details/analysis pages)
- [ ] 3.2 Replace those local interfaces with imported types from `sdk/strapi/types.gen.ts`; use the `mapStrapiAssessment` adapter at page boundaries where SDK types are wider than needed
- [ ] 3.3 Update `types/assessment.ts` — remove any types fully covered by SDK exports; keep only types for Firebase-specific data (submission records) and UI-local state that have no SDK equivalent
- [ ] 3.4 Run `tsc --noEmit` to confirm no type errors after migration

## 4. Rewrite Browse/Landing Page (`app/(auth)/assessments/page.tsx`)

- [x] 4.1 Replace raw `fetch` + `useEffect` + `useState` for all-assessments with `useAssessments` SWR hook (`useSWRInfinite`)
- [x] 4.2 Replace bare `useEffect` for assigned assessments with `useAssignedAssessments` SWR hook (conditional fetch — only when tab is active and `leadId` is available)
- [x] 4.3 Derive category filter chips dynamically from API data (deduplicated union of `category[]` across loaded items); remove hardcoded `ASSESSMENT_CATEGORIES` string array
- [x] 4.4 Implement grouping logic: first PUBLISHED item → "Recommended" hero card (dark card matching `AssessmentsLanding.png`); anxiety/depression/sleep items → "Popular Screenings"; remaining → "Personal Growth"
- [x] 4.5 Implement infinite-scroll trigger: on scroll within 500px of bottom, call `setSize(s => s + 1)` on SWR infinite
- [x] 4.6 Update `handleBrowseAssessment` to navigate to `/assessment/details?id=<id>` (not `/assessments/<slug>`)
- [x] 4.7 Remove all imports from `constants.ts` in this file

## 5. Rewrite Detail/Intro Page (`app/(public)/assessment/details/page.tsx`)

- [x] 5.1 Replace `axios.get` + `useEffect` with `useAssessmentById(assessmentId)` SWR hook
- [x] 5.2 Delete local `AssessmentDetail` interface; use SDK type via adapter
- [x] 5.3 Render hero image, title, category badges, clinically-validated badge (from `landingTitle`), duration + question count stat row, and bullet highlights from `landingTitle.points` — matching `AssessmentIntro.png`
- [x] 5.4 Keep Firebase completion check (`checkCompletion`) for showing "View Analysis" / "Retake" buttons; this is not migrated to SDK (Firebase-only data)
- [x] 5.5 Ensure sticky bottom CTA navigates to `/assessment/<id>` for start/retake and `/assessment/analysis?id=<id>` for view analysis

## 6. Rewrite Form Page (`app/(public)/assessment/[id]/page.tsx`)

- [x] 6.1 Replace `useEffect`+`useState` fetch with `useAssessmentById(assessmentId)` SWR hook
- [x] 6.2 Delete local `AssessmentData` interface; derive question type from SDK type via adapter
- [x] 6.3 Update progress bar UI to orange accent matching `ActivityAssessment.png` (step counter "Step X of Y", orange progress bar)
- [x] 6.4 Update option selection UI to match `OptionSelection.png`: rounded rows, orange highlight on selection, filled orange checkmark icon on selected row
- [x] 6.5 Replace completion screen with reference `AssessmentComplete.png` layout: orange top bar at 100%, centred circle icon, "Assessment Complete" title, "AI-Generated Report" disclaimer card, orange "GENERATE REPORT" CTA button navigating to `/assessment/analysis?id=<id>`
- [x] 6.6 Ensure "Back" on step 0 returns to `/assessment/details?id=<id>` (not a generic back)

## 7. Rewrite Report/Analysis Page (`app/(public)/assessment/analysis/page.tsx`)

- [x] 7.1 Wrap Firebase Realtime DB read in `useSWR` keyed by `['assessment-submissions', leadId, assessmentId]`; remove bare `useEffect` data loading
- [x] 7.2 Delete local interfaces that duplicate Strapi shapes; keep only `Submission` / `SubmissionEntry` (Firebase-specific, no SDK equivalent)
- [x] 7.3 Render "Assessment Report" header with "AI-generated summary" badge matching `AssessmentReport.png`
- [x] 7.4 Derive a score/summary line from the most recent submission's answer data (e.g. average of numeric `selected` values mapped to a label like "Moderate (72%)")
- [x] 7.5 Render summary prose section from submission data
- [x] 7.6 Add orange "Book appointment with a specialist" CTA button navigating to `/appointments`
- [x] 7.7 Add disclaimer text below CTA: "This summary is generated by AI based on your answers. It is for informational purposes only and does not replace professional medical advice."

## 8. Verification & Cleanup

- [x] 8.1 Run `tsc --noEmit` — zero errors expected
- [ ] 8.2 Manually test browse → detail → form → completion → report navigation flow end-to-end
- [ ] 8.3 Verify category filter chips render from API data (not static list)
- [ ] 8.4 Verify infinite scroll loads more assessments on the browse page
- [ ] 8.5 Verify "My Assessments" tab shows Firestore-assigned items correctly
- [x] 8.6 Confirm no remaining files import from `app/(auth)/assessments/constants.ts` or the deleted route files
- [x] 8.7 Run `next build` — pre-existing SDK build errors unrelated to this migration (`.ts` import extension issues in generated SDK files)
