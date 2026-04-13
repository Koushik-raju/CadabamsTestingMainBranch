## ADDED Requirements

### Requirement: Shared question components location
The system SHALL relocate `AssessmentQuestionCard` and all answer selector components to `components/shared/questions/` so they can be consumed by both the assessment feature and journey task flows without duplication.

#### Scenario: Assessment pages import from shared location
- **WHEN** assessment pages import question components
- **THEN** all imports SHALL resolve from `@/components/shared/questions/` not `@/components/assessment/`

#### Scenario: Journey task screen imports from shared location
- **WHEN** a journey task screen renders a question
- **THEN** it SHALL import `AssessmentQuestionCard` from `@/components/shared/questions/assessment-question-card`

### Requirement: Question card uses theme colors
The system SHALL ensure all question and answer selector components use only Tailwind theme color tokens (`text-primary`, `bg-primary`, `border-primary`, `text-muted-foreground`, etc.) with no hardcoded hex or named colors (e.g. no `text-orange-600`, `bg-orange-50`, `border-slate-300`).

#### Scenario: No hardcoded colors in question components
- **WHEN** any question component file is inspected
- **THEN** no hardcoded color classes (e.g. `orange-`, `slate-`, `blue-`) SHALL appear; only theme tokens SHALL be used

### Requirement: Answer selector components
The system SHALL provide the following answer selector components under `components/shared/questions/answer-selectors/`:
- `mcq.tsx` — single-choice MCQ with radio-style selection
- `multi-dropdown.tsx` — multi-select dropdown
- `smiley.tsx` — 5-emoji smiley scale
- `yes-no.tsx` — two-option Yes/No

#### Scenario: MCQ renders options
- **WHEN** `mcq.tsx` is rendered with an options array
- **THEN** each option SHALL appear as a selectable row, with the selected row highlighted using `bg-primary/10` and `border-primary`

#### Scenario: Smiley selector renders 5 options
- **WHEN** `smiley.tsx` is rendered
- **THEN** exactly 5 emoji buttons SHALL be displayed in a row

### Requirement: Question renderer delegates to answer selectors
The system SHALL provide a `QuestionRenderer` component at `components/shared/questions/question-renderer.tsx` that receives a question object and current answer, and delegates rendering to the correct answer selector based on `question.type`.

#### Scenario: Type-based delegation
- **WHEN** `QuestionRenderer` receives a question with type containing "smiley"
- **THEN** it SHALL render the `SmileySelector` component

#### Scenario: Fallback to textarea
- **WHEN** `QuestionRenderer` receives a question with an unrecognised type
- **THEN** it SHALL render a textarea input as fallback
