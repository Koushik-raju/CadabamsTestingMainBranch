## ADDED Requirements

### Requirement: Verify task completion on return from task page
When the user returns to the journey details page from a task page (assessment, audio, journal, booking, gift), the page SHALL re-fetch the enrollment from the server and reconcile local state. The server is the source of truth — the frontend SHALL NOT guess completion status.

#### Scenario: User completes assessment and returns
- **WHEN** the user submits an assessment and is redirected back to `/journeys/{id}/details` via `redirectTo`
- **THEN** on mount, the page calls `mutate(journeyEnrollmentKey(journeyId))` to re-fetch
- **AND** if the task's `state` is now `completed`, XP float + haptic success are triggered

#### Scenario: Task did not auto-complete on the server
- **WHEN** user returns but the task `state` is still `active`
- **THEN** the page calls `tickJourney(progress.id, journeyId)` once to let the server reconcile
- **AND** if still not `completed` after tick, no XP/haptic fires (the task genuinely isn't done)

### Requirement: Do not client-side-mark tasks done
The frontend SHALL NEVER optimistically mark a task as `completed` in UI state when the server hasn't done so. All state transitions flow from server → SWR cache → UI.

#### Scenario: Optimistic completion attempt
- **WHEN** user returns from a task page
- **THEN** the UI does NOT locally set `state: 'completed'` on any task; it waits for the `mutate` result
