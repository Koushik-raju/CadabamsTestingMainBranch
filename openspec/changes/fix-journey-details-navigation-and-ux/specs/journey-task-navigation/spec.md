## ADDED Requirements

### Requirement: Primary CTA navigates only, does not mutate progress
Tapping the primary action button in `JourneyTaskActionSheet` (the `onOpen` callback) SHALL navigate the user to the task's `destinationPath` and SHALL NOT call `updateNodeProgress`. Progress mutation is exclusively the responsibility of the "Mark as Done" secondary button (`onMarkDone`).

#### Scenario: User taps primary CTA on an active navigable task
- **WHEN** the user taps the primary CTA (e.g. "Start Assessment", "Listen Now") in the action sheet
- **THEN** the app navigates to `destinationPath` (with `redirectTo` back-param) and `updateNodeProgress` is NOT called

#### Scenario: User taps primary CTA on a read task
- **WHEN** the user taps "Mark as Read" on a read-type task
- **THEN** `updateNodeProgress` IS called (this is the explicit done action for read tasks) and the sheet closes

#### Scenario: User taps "Mark as Done" secondary button
- **WHEN** the user taps the "Mark as Done" secondary button on an audio or video task
- **THEN** `updateNodeProgress` IS called, the sheet closes, and XP float is triggered

### Requirement: Navigation guards when destinationPath is absent
When `destinationPath` is null or undefined on the enrollment task entry, the primary CTA SHALL remain tappable but SHALL show a fallback toast ("Task not available") instead of silently no-oping.

#### Scenario: destinationPath missing
- **WHEN** the user taps the primary CTA and `destinationPath` is not set on the enrollment task
- **THEN** the sheet closes and a brief toast is shown: "This task isn't available yet"
- **AND** `updateNodeProgress` is NOT called
