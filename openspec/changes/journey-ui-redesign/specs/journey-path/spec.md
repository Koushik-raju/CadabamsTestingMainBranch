## ADDED Requirements

### Requirement: Journey path page
The system SHALL render a gamified vertical path page at `/journeys/[id]/path` showing the journey title in the app-bar, a stats row (streak, gems, progress %), unit header bars, and a vertical chain of task nodes.

#### Scenario: Path page renders
- **WHEN** a subscribed user navigates to `/journeys/[id]/path`
- **THEN** the app-bar, stats row, unit header, and node chain SHALL all be visible

#### Scenario: Redirect non-subscribed user
- **WHEN** a non-subscribed user navigates to `/journeys/[id]/path`
- **THEN** the system SHALL redirect to `/journeys/[id]/details`

### Requirement: Stats row
The system SHALL display a horizontal stats row beneath the app-bar showing: flame icon + streak count, gem icon + gem count, and a circular progress percentage.

#### Scenario: Stats row shows live data
- **WHEN** the user's progress is loaded from Firebase RTDB
- **THEN** streak, gems, and completion % SHALL reflect the stored values

### Requirement: Unit header bar
The system SHALL display an orange unit header bar before each unit's node group. The bar SHALL show the unit number, unit title (e.g. "Emotional Awareness"), and a "Guidebook" chip button on the right.

#### Scenario: Unit header renders per unit
- **WHEN** the path page loads
- **THEN** each journey step/unit SHALL be preceded by its header bar

### Requirement: Task nodes vertical chain
The system SHALL render each task in a step as a circular node in a vertical zigzag chain. Node types map to icons: video/play → play triangle, book/read → book, audio → headphones, journal → pencil, assessment → numbered badge, gift/reward → gift box, trophy → trophy. The current active node SHALL be larger with an orange fill and a pulse animation. Completed nodes SHALL show an orange check. Locked nodes SHALL show a gray background with a lock icon.

#### Scenario: Completed node appearance
- **WHEN** a task has been completed by the user
- **THEN** the node SHALL display an orange background with a white checkmark

#### Scenario: Active node appearance
- **WHEN** a task is the current task (next to complete)
- **THEN** the node SHALL display an orange fill, be slightly larger, and have a tailwind-animate pulse ring

#### Scenario: Locked node appearance
- **WHEN** a task is not yet reachable (prior tasks incomplete)
- **THEN** the node SHALL display a gray background with a lock icon and be non-interactive

#### Scenario: Tapping an active node
- **WHEN** a user taps the current active node
- **THEN** the app SHALL navigate to the appropriate task screen (assessment, audio player, journal, etc.)

#### Scenario: Tapping a locked node on premium content
- **WHEN** a user taps a locked node that requires premium
- **THEN** a bottom sheet SHALL appear with "Unlock with a plan" message and a CTA navigating to `/packages`

### Requirement: Zigzag node layout
The system SHALL offset alternating nodes left and right to create a visual zigzag path, implemented with CSS translate-x utilities (not SVG).

#### Scenario: Nodes alternate sides
- **WHEN** the path renders
- **THEN** odd-indexed nodes SHALL be offset to the left and even-indexed to the right (or vice versa per design)

### Requirement: Continue CTA footer
The system SHALL show a sticky orange "CONTINUE" button at the bottom that navigates to the current active task.

#### Scenario: Continue button tapped
- **WHEN** a user taps "CONTINUE"
- **THEN** the app SHALL navigate to the same screen as tapping the active node

#### Scenario: Continue button hidden at journey end
- **WHEN** all tasks in the journey are completed
- **THEN** the footer SHALL show "Journey Complete 🎉" instead of the Continue button
