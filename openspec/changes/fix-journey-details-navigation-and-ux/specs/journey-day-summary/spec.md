## ADDED Requirements

### Requirement: Day summary shown after all tasks for the day are completed
When all tasks for `progress.currentDay` transition to `completed`, the app SHALL display a "Day Complete" summary bottom sheet. The summary SHALL call a backend endpoint to generate personalised summary text, display it, and provide a CTA to continue to the next day.

**Note**: This requires a backend endpoint — if `journeysControllerGetDaySummary` (or equivalent) does not exist in the SDK, this must be flagged to the user before implementation and the UI should gracefully degrade (show a static congratulations message while the SDK is updated).

#### Scenario: All tasks complete — summary sheet appears
- **WHEN** `todayDone === todayTotal && todayTotal > 0` transitions to true (tasks just completed)
- **THEN** a bottom sheet opens with a loading skeleton, then renders the server-generated summary text

#### Scenario: Backend summary unavailable
- **WHEN** the summary API returns an error or the SDK function does not exist
- **THEN** the sheet shows a static "Day {currentDay} complete! Keep going." message with a "Next Day →" CTA

#### Scenario: User dismisses summary
- **WHEN** the user swipes down or taps "Next Day →" 
- **THEN** the sheet closes and the path view scrolls to the first task of the next day

### Requirement: Day summary is not shown for already-completed days on re-visit
The summary sheet SHALL only auto-open when the completion event occurs in the current session. On revisiting a previously completed day it SHALL NOT auto-open.

#### Scenario: Re-visit page with completed day
- **WHEN** all day tasks are already completed when the page loads
- **THEN** the summary sheet does NOT auto-open
