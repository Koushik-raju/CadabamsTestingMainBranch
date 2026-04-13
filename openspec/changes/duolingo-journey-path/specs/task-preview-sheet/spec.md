## ADDED Requirements

### Requirement: Node tap opens a preview sheet
When a user taps a non-locked path node, the system SHALL display a bottom sheet containing the task title, task type badge, gems reward, and a primary CTA button. Navigation to the task SHALL only occur after the user taps the CTA.

#### Scenario: Tap active node shows preview sheet
- **WHEN** the user taps the active (glowing) path node
- **THEN** a bottom sheet slides up showing the task title, task type icon + label, "+10 XP ⚡" reward chip, and a "Start" button

#### Scenario: Tap completed node shows review sheet
- **WHEN** the user taps a completed path node
- **THEN** a bottom sheet slides up showing the task title, a "Completed ✓" badge, and a "Review" button

#### Scenario: Locked node tap does nothing (or shows premium sheet)
- **WHEN** the user taps a locked path node
- **THEN** no preview sheet opens; if the step is premium-locked, the premium upgrade sheet opens instead

#### Scenario: CTA button navigates to task
- **WHEN** the user taps "Start" or "Review" in the preview sheet
- **THEN** the sheet dismisses and the app navigates to the appropriate task route (assessment, audio, worksheet, etc.)

#### Scenario: Sheet dismisses on backdrop tap
- **WHEN** the user taps outside the bottom sheet
- **THEN** the sheet closes without navigating

### Requirement: Preview sheet shows task metadata
The task preview sheet SHALL display: task type as a colored pill badge (Assessment, Audio, Journal, etc.), task title, and XP reward "+10 XP ⚡". XP is the existing `gems` value displayed under the XP/Stars system — no new data fields are introduced.

#### Scenario: Assessment task preview
- **WHEN** the preview sheet opens for an assessment task
- **THEN** a purple "Assessment" badge and ClipboardList icon are shown alongside the task title

#### Scenario: Audio task preview
- **WHEN** the preview sheet opens for an audio task
- **THEN** a blue "Audio" badge and Headphones icon are shown alongside the task title
