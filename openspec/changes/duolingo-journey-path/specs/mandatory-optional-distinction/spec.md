## ADDED Requirements

### Requirement: Mandatory task visual distinction
Mandatory tasks SHALL be visually differentiated from optional tasks on the path so users understand which tasks must be completed to advance.

Mandatory tasks are defined as: tasks with `assessments.length > 0`, `audios.length > 0`, or `fillSelfJournal === true`.
Optional tasks are: `worksheets`, `moodCheckIn`, or tasks with `showAppointments/showFirstBooking`.

#### Scenario: Mandatory node has bold border ring
- **WHEN** a mandatory, non-completed task node is rendered
- **THEN** the node circle has a thick primary-colored outer ring or border to indicate it is required

#### Scenario: Optional node has muted/dashed styling
- **WHEN** an optional, non-completed task node is rendered in default state
- **THEN** the node has a dashed or thinner border with muted color to indicate it is optional

#### Scenario: Optional label shown in preview sheet
- **WHEN** the task preview sheet opens for an optional task
- **THEN** an "Optional" chip/badge is visible in the sheet header

#### Scenario: Mandatory label shown in preview sheet
- **WHEN** the task preview sheet opens for a mandatory task
- **THEN** no "Optional" chip appears (mandatory is the default expectation)
