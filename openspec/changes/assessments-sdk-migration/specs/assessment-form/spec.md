## ADDED Requirements

### Requirement: Form page loads questions via SDK + SWR
`app/(public)/assessment/[id]/page.tsx` SHALL replace its `useEffect`+`useState` data fetch with `useAssessmentById(id)` (SWR wrapper). All locally defined interfaces that shadow SDK types (e.g. `AssessmentData`) SHALL be removed; the `Questions` array type SHALL come from `sdk/strapi/types.gen.ts`.

#### Scenario: Questions load and render
- **WHEN** the user navigates to `/assessment/<id>`
- **THEN** SWR fetches via `getApiV1AssessmentsById` and the first question renders after the loading skeleton resolves

#### Scenario: Loading skeleton matches reference design
- **WHEN** SWR is in the loading state
- **THEN** a progress-bar skeleton and question-card skeleton are shown matching the reference ActivityAssessment.png layout

### Requirement: Question flow matches reference UI
The form page SHALL render: (1) an orange progress bar at the top with step counter ("Step X of Y"), (2) assessment title in orange as the section heading, (3) each question's prompt text, (4) answer options as rounded selector rows with a radio-style indicator. The "Continue" button at the bottom SHALL be disabled until the current question has a valid answer selected.

#### Scenario: Progress bar advances on continue
- **WHEN** the user answers question 2 of 10 and taps "Continue"
- **THEN** the progress bar advances to 30% and question 3 renders

#### Scenario: Continue disabled when no answer selected
- **WHEN** the current question is unanswered (MCQ with empty selection)
- **THEN** the "Continue" button is disabled and cannot be tapped

#### Scenario: Option selection renders as per OptionSelection reference
- **WHEN** the user taps an MCQ option row
- **THEN** the row highlights in orange and a filled orange checkmark appears on the right

### Requirement: Completion screen matches reference design
After the last question is submitted, the page SHALL show the "Assessment Complete" screen matching `AssessmentComplete.png`: centred layout, orange progress bar at top (100%), title "Assessment Complete", subtitle text, an "AI-Generated Report" disclaimer card, and an orange "GENERATE REPORT" CTA button that navigates to `/assessment/analysis?id=<id>`.

#### Scenario: Completion screen shown after submit
- **WHEN** answers are submitted successfully to Firebase and backend
- **THEN** the completion screen renders with the "GENERATE REPORT" button visible

#### Scenario: Generate Report navigates to analysis
- **WHEN** the user taps "GENERATE REPORT"
- **THEN** the router pushes to `/assessment/analysis?id=<assessmentId>`

### Requirement: Dead form route is removed
`app/(public)/assessment/form/page.tsx` (the old search-param-based form page) SHALL be deleted. The canonical form route is `app/(public)/assessment/[id]/page.tsx`.

#### Scenario: Old form route is unreachable
- **WHEN** a user navigates to `/assessment/form?id=<id>`
- **THEN** Next.js returns 404
