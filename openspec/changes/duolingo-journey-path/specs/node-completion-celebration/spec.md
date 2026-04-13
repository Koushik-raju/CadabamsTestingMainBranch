## ADDED Requirements

### Requirement: XP float-up animation on task completion
When a task is marked complete, the system SHALL display a "+10 XP" label that floats upward over the completed node and fades out within 1.2 seconds. XP maps to the existing `gems` field in `JourneyProgress` — no new Firebase fields are introduced; only the display label changes from "Gems" to "XP".

#### Scenario: XP popup appears after completion
- **WHEN** `updateNodeProgress` resolves successfully
- **THEN** a "+10 XP ⚡" label appears over the active node, animates upward with fade-out, then is removed from DOM after 1.2s

#### Scenario: XP popup does not stack
- **WHEN** a completion animation is already playing
- **THEN** a second tap does not trigger a second float-up popup

### Requirement: Node scale-bounce on completion
The newly completed node SHALL briefly scale up then back to normal size to confirm the action.

#### Scenario: Node bounce on complete
- **WHEN** a task node transitions from active to completed
- **THEN** the node circle plays a scale bounce: 1.0 → 1.2 → 1.0 over 300ms using `animate-in zoom-in-50` or CSS transition

### Requirement: Active node speech bubble shows task title
The speech bubble above the active node SHALL display the task title (truncated to ~20 chars if long) instead of the generic "Start" label.

#### Scenario: Speech bubble shows task name
- **WHEN** the path view renders with an active node
- **THEN** the speech bubble above the active node shows the task title (e.g., "Breathing Exercise") instead of "Start"

#### Scenario: Speech bubble falls back to "Start" if title is missing
- **WHEN** the active task has no extractable title
- **THEN** the speech bubble shows "Start"
