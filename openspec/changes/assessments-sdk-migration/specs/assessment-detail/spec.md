## ADDED Requirements

### Requirement: Detail page fetches assessment via SDK + SWR
`app/(public)/assessment/details/page.tsx` SHALL use `useAssessmentById(id)` (a `useSWR` wrapper around `getApiV1AssessmentsById`) instead of raw `axios`. The `id` is read from the `?id=` search param. All manually-defined local interfaces (`AssessmentDetail`) SHALL be deleted and replaced with the SDK-generated response type from `sdk/strapi/types.gen.ts`.

#### Scenario: Detail page loads assessment data
- **WHEN** the user navigates to `/assessment/details?id=<id>`
- **THEN** SWR fetches via `getApiV1AssessmentsById` and renders title, description, category badges, duration, and question count

#### Scenario: Loading skeleton shown before data resolves
- **WHEN** SWR is in the loading state
- **THEN** skeleton placeholders render for the image, title, and stat boxes

#### Scenario: Error state shown on fetch failure
- **WHEN** `getApiV1AssessmentsById` throws or returns an error
- **THEN** an error card with a "Go Back" button is displayed

### Requirement: Detail page UI matches reference design
The detail page SHALL render: hero image (if present), title, category badge(s), clinically-validated badge (from `landingTitle` if present), a stats row with duration and question count, bullet highlights from `landingTitle.points`, and an optional disclaimer from `landingTitle.footer`. A sticky bottom CTA renders "Start Assessment" (or "Retake Assessment" if Firebase completion record exists).

#### Scenario: Start CTA navigates to form
- **WHEN** the user taps "Start Assessment"
- **THEN** the router pushes to `/assessment/<id>`

#### Scenario: Completed assessment shows retake and view analysis CTAs
- **WHEN** Firebase Realtime DB contains a submission record for this assessment and user
- **THEN** both "View Analysis" and "Retake Assessment" buttons are shown

### Requirement: Duplicate detail route is removed
`app/(auth)/assessments/[slug]/page.tsx` (which fetches the same assessment detail and question flow) SHALL be deleted. Any internal links pointing to `/assessments/<slug>` SHALL be updated to point to `/assessment/details?id=<id>` or `/assessment/<id>` as appropriate.

#### Scenario: Old slug route is no longer reachable
- **WHEN** a user navigates to `/assessments/<slug>`
- **THEN** Next.js returns 404 (no page file exists at that route)
