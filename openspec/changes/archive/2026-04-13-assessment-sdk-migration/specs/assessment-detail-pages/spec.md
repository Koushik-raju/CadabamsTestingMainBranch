## ADDED Requirements

### Requirement: Assessment details page matches reference design
The details page at `app/(auth)/assessments/[id]/details/page.tsx` SHALL match the `assessments-details-page.png` reference. It SHALL use path param `id` (not query param).

#### Scenario: Details page layout
- **WHEN** user navigates to `/assessments/{id}/details`
- **THEN** it SHALL display: back button, "Clinically Validated" badge (if applicable), assessment title, description, duration and question count in a stats row, benefit points list with checkmark icons, privacy note, and a full-width "Start Assessment →" CTA button at the bottom

#### Scenario: Data loading
- **WHEN** the page loads
- **THEN** it SHALL use `useAssessmentById(id)` from the consolidated hook and show a skeleton while loading

#### Scenario: Start assessment navigation
- **WHEN** user taps "Start Assessment"
- **THEN** it SHALL navigate to `/assessments/{id}` (the question flow page)

### Requirement: MCQ question type matches reference design
The MCQ question renderer SHALL match `mcq-type-question.png` — each option displayed as a card row with icon, label, and radio-style selection indicator.

#### Scenario: MCQ option display
- **WHEN** a question of type "mcq" renders with 5 options
- **THEN** each option SHALL display as a bordered card row with an icon (if available), label text, and a circular selection indicator on the right
- **AND** the selected option SHALL have an orange border highlight and filled checkmark

#### Scenario: MCQ selection
- **WHEN** user taps an option
- **THEN** that option SHALL become selected (orange border + checkmark) and the "Continue" button SHALL become enabled

### Requirement: Multi-question dropdown type matches reference design
Questions with multiple sub-questions and dropdown answers SHALL match `multi-question-drop-down.png` and `multi-question-drop-down-2.png`.

#### Scenario: Dropdown question layout
- **WHEN** a question with multiple sub-items renders (e.g., "Adult Attachment Check-in")
- **THEN** it SHALL display: back arrow, step counter ("Step 3 of 10"), title, description, instruction text, and each sub-question with a "Select an option" dropdown trigger

#### Scenario: Dropdown selection via bottom sheet
- **WHEN** user taps a "Select an option" dropdown
- **THEN** a bottom sheet SHALL appear titled "Choose response" with radio-style options (e.g., "Strongly Disagree" through "Strongly Agree")
- **AND** selecting an option SHALL close the sheet and show the selected value in the dropdown trigger

### Requirement: Assessment complete page matches reference design
The completion screen SHALL match `assessment-complete-page.png`.

#### Scenario: Completion display
- **WHEN** user submits the final question
- **THEN** the page SHALL show: orange progress bar at 100%, checkmark icon in orange circle, "Assessment Complete" heading, description text, AI-generated report disclaimer card, and "GENERATE REPORT →" CTA button

#### Scenario: Generate report navigation
- **WHEN** user taps "Generate Report"
- **THEN** it SHALL navigate to `/assessments/{id}/analysis`

### Requirement: Assessment report page matches reference design
The report page at `app/(auth)/assessments/[id]/analysis/page.tsx` SHALL match `assessment-report-page.png`.

#### Scenario: Report page layout
- **WHEN** user navigates to the analysis page with existing submissions
- **THEN** it SHALL display: close button, "Assessment Report" header, "AI-generated summary" badge, narrative report text with bold highlights, AI disclaimer footer, and "Book appointment with a specialist" CTA button

#### Scenario: Report data source
- **WHEN** the report page loads
- **THEN** it SHALL use `useAssessmentSubmissions(leadId, assessmentId)` from the consolidated hook

#### Scenario: No submissions
- **WHEN** user has no prior submissions
- **THEN** it SHALL display an empty state with "Take Assessment" CTA

### Requirement: Question flow progress bar
The question flow page SHALL display an orange progress bar showing current step out of total.

#### Scenario: Progress display
- **WHEN** user is on step 3 of 10
- **THEN** the progress bar SHALL be filled to 30% with orange color
- **AND** step counter text "Step 3 of 10" SHALL be visible

### Requirement: Question flow uses consolidated hook for submission
The question flow page SHALL use `submitAssessment` from the consolidated hook instead of inline Firebase + backendClient calls.

#### Scenario: Assessment submission
- **WHEN** user completes the last question and taps submit
- **THEN** the page SHALL call `submitAssessment(leadId, assessmentId, formattedAnswers)` from the hook
- **AND** it SHALL NOT directly import `backendClient`, `endpoints`, or Firebase `push`/`ref`
