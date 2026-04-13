## ADDED Requirements

### Requirement: Journey details page
The system SHALL render a journey details page at `/journeys/[id]/details` with a hero image, level/duration/time-per-day badges, title, description, curator info, "What you'll achieve" outcomes grid, "Journey Syllabus" accordion, and a sticky "Subscribe to Journey →" footer CTA.

#### Scenario: Page renders with all sections
- **WHEN** a user navigates to `/journeys/[id]/details`
- **THEN** all sections (hero, badges, title, description, curator, outcomes, syllabus, CTA) SHALL be visible

#### Scenario: Loading state
- **WHEN** journey data is being fetched
- **THEN** skeleton placeholders SHALL fill each section

#### Scenario: Journey not found
- **WHEN** the journey ID does not exist in Strapi
- **THEN** the page SHALL show an error state with a back button

### Requirement: Level and duration badges
The system SHALL display pill badges below the hero image showing: difficulty level (e.g. "Beginner"), total days (e.g. "90 Days"), and time-per-day estimate (e.g. "5-10 min/day").

#### Scenario: Badges visible
- **WHEN** the journey detail loads
- **THEN** all three badges SHALL be visible using theme color tokens (no hardcoded colors)

### Requirement: Curator info row
The system SHALL display a curator row with avatar image, curator name, and their role/title (e.g. "Curated by Dr. Ananya — Clinical Psychologist").

#### Scenario: Curator row renders
- **WHEN** the journey has curator metadata from Strapi
- **THEN** the avatar, name, and title SHALL be displayed in a horizontal row

#### Scenario: Curator row hidden when no curator data
- **WHEN** the journey has no curator metadata
- **THEN** the curator row SHALL not be rendered

### Requirement: What you'll achieve outcomes grid
The system SHALL display up to 4 outcome items in a 2×2 grid, each with an icon and label (e.g. "Understand your triggers", "Build emotional resilience").

#### Scenario: Outcomes grid renders
- **WHEN** the journey has achievement/outcome data
- **THEN** up to 4 outcomes SHALL be shown in a 2-column grid with icons

### Requirement: Journey Syllabus accordion
The system SHALL display the journey's steps (units) as an accordion list. Each row shows: step number (orange circle), title, day range, task count, and a lock icon if the step is locked (user not subscribed or step not yet reached). Tapping expands to show step description.

#### Scenario: Syllabus rows render
- **WHEN** the journey has steps
- **THEN** each step SHALL appear as an accordion row with number, title, day range, and task count

#### Scenario: Lock icon on locked steps
- **WHEN** the user is not subscribed to the journey
- **THEN** all steps except the first SHALL show a lock icon

#### Scenario: Expand step on tap
- **WHEN** a user taps a syllabus row
- **THEN** the row SHALL expand to show the step description with a smooth animation (tailwind-animate)

### Requirement: Subscribe to Journey CTA
The system SHALL show a sticky footer with "Total Duration: X Months" label and a "Subscribe to Journey →" button. For premium journeys, the button label SHALL be "Unlock Premium Journey". Tapping for a free journey writes the subscription to Firebase RTDB and navigates to `/journeys/[id]/path`. Tapping for a premium journey navigates to `/packages`.

#### Scenario: Free journey subscribe
- **WHEN** a user taps "Subscribe to Journey →" on a free journey
- **THEN** the system SHALL write subscription data to Firebase RTDB and navigate to `/journeys/[id]/path`

#### Scenario: Premium journey unlock
- **WHEN** a user taps "Unlock Premium Journey" on a premium journey
- **THEN** the app SHALL navigate to `/packages` without writing any Firebase data

#### Scenario: Already subscribed
- **WHEN** the user is already subscribed to the journey
- **THEN** the CTA SHALL read "Continue Journey →" and navigate directly to `/journeys/[id]/path`
