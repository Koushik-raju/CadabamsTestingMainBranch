## ADDED Requirements

### Requirement: Wizard skip clears associated filter state
When a user skips an optional step in the WizardView, the system SHALL clear any selections made for that step before transitioning to the next step or the list view, so that the ListView does not filter doctors based on unintended wizard selections.

#### Scenario: Skip issues step clears issue selections
- **WHEN** a user has selected one or more issues in the WizardView issues step
- **WHEN** the user taps "Skip for now"
- **THEN** the `issues` filter state SHALL be cleared (empty array)
- **THEN** the wizard SHALL advance to the mode step
- **THEN** the ListView SHALL show all doctors unfiltered by issues

#### Scenario: Skip issues step with no selections advances cleanly
- **WHEN** a user has made no issue selections in the WizardView issues step
- **WHEN** the user taps "Skip for now"
- **THEN** the wizard SHALL advance to the mode step with no state change to issues

#### Scenario: Skip language step clears language selections
- **WHEN** a user has selected one or more languages in the WizardView language step
- **WHEN** the user taps "Skip — no preference"
- **THEN** the `languages` filter state SHALL be cleared (empty array)
- **THEN** the view SHALL transition to ListView
- **THEN** the ListView language filter chip SHALL show the default unfiltered label ("Language")

#### Scenario: Skip language step with no selections transitions cleanly
- **WHEN** a user has made no language selections in the WizardView language step
- **WHEN** the user taps "Skip — no preference"
- **THEN** the view SHALL transition to ListView with no state change to languages

### Requirement: Filter chip labels reflect cleared state after wizard skip
After the wizard completes via any skip path, the ListView filter chips SHALL accurately reflect the actual active filter state.

#### Scenario: Language chip label after skip
- **WHEN** the language step was skipped
- **THEN** the language chip in ListView SHALL display "Language" (unselected state)
- **THEN** the chip SHALL render in its inactive visual style (no primary highlight)

#### Scenario: Experiencing chip label after skip
- **WHEN** the issues step was skipped
- **THEN** the experiencing chip in ListView SHALL display "Experiencing" (unselected state)
- **THEN** the chip SHALL render in its inactive visual style
