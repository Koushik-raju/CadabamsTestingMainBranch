## ADDED Requirements

### Requirement: Path auto-scrolls to current day node on mount
When the page loads and the user is subscribed, the path chain SHALL automatically scroll to the first node of `progress.currentDay` with a smooth animation. A "Continue →" button in the today banner SHALL also trigger the same scroll.

#### Scenario: Auto-scroll on mount
- **WHEN** `isSubscribed` is `true` and the page mounts
- **THEN** within 400 ms of the path rendering, the view scrolls smoothly so the first active node of `currentDay` is centered or near the top of the visible area
- **AND** the node briefly pulses (scale animation) to draw the user's eye

#### Scenario: Continue button taps triggers scroll
- **WHEN** the user taps a "Continue →" button in the today banner
- **THEN** the view scrolls smoothly to the first active/available node of `currentDay`

### Requirement: Scroll target is the first non-completed task of the current day
The auto-scroll SHALL target the first task node of `currentDay` whose state is `active` or `available`. If all tasks are `completed`, it SHALL scroll to the last completed node of that day.

#### Scenario: Partially completed day
- **WHEN** day 3 has 3 tasks and the first 2 are completed
- **THEN** auto-scroll lands on the 3rd task node (first non-completed)

#### Scenario: All tasks completed for the day
- **WHEN** all tasks on `currentDay` are `completed`
- **THEN** auto-scroll lands on the last completed node of that day

### Requirement: Back navigation from task page returns to details and preserves scroll position
When the user completes a task and is navigated back to the details page via `redirectTo`, the page SHALL restore the previous scroll position rather than jumping to the top.

#### Scenario: Return from task page
- **WHEN** user taps back from an assessment/audio/journal page with `redirectTo=/journeys/{id}/details`
- **THEN** the details page re-mounts and scrolls back to the same node position as before navigation
