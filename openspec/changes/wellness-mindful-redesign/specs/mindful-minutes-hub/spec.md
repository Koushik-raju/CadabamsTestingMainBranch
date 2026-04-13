## ADDED Requirements

### Requirement: SWR hook for mindful minutes list
The system SHALL provide a `useMindfulMinutes` hook in `hooks/use-mindful-minutes.ts` that wraps `getApiV1MindfulMinutes` with SWR and returns `{ items, categories, isLoading, error, mutate }`.

#### Scenario: Successful list load
- **WHEN** the hook mounts
- **THEN** `items` contains the array of `MindfulMinute` objects and `categories` contains unique category strings with "All" first

#### Scenario: Load failure
- **WHEN** the API call throws
- **THEN** `error` is non-null and `items` is an empty array

### Requirement: SWR hook for mindful minute detail
The system SHALL provide a `useMindfulMinuteDetail(slug)` hook that wraps `getApiV1MindfulMinutesSlugBySlug` with SWR and returns `{ mindfulMinute, isLoading, error }`.

#### Scenario: Successful detail load
- **WHEN** a valid slug is provided
- **THEN** `mindfulMinute` is populated including its `audios` array

#### Scenario: Not found
- **WHEN** the slug resolves to no data
- **THEN** `error` is set with a user-friendly message

### Requirement: API-driven category filters on mindful minutes list page
The list page SHALL build its category filter options entirely from the API response. The `BROWSE_BY_NEED` hardcoded array SHALL be removed. Category grid items SHALL be derived from API categories.

#### Scenario: Categories from API
- **WHEN** items load
- **THEN** the category filter shows "All" plus each unique category value found in the items

#### Scenario: Category grid wires to filter
- **WHEN** user taps a category in the "Explore categories" grid
- **THEN** `selectedCategory` is set to that category and the list filters accordingly

### Requirement: Functional sort on mindful minutes detail page
The "Shortest first" sort control on the detail page SHALL sort the audio list by duration (ascending). A second tap SHALL sort longest first (descending). The sort order SHALL alternate on each tap.

#### Scenario: Sort ascending
- **WHEN** the user taps "Shortest first"
- **THEN** the audio list is reordered with shortest duration first; the label changes to "Longest first"

#### Scenario: Sort descending
- **WHEN** the user taps again
- **THEN** the audio list is reordered with longest duration first; the label reverts to "Shortest first"

### Requirement: Real duration display
Duration labels in audio list cards SHALL display actual duration values. If the API provides a `duration` field, use it. Otherwise derive duration from audio metadata after load and display it as `m:ss`. The hardcoded strings "1:30 min" and "3 min" SHALL be removed.

#### Scenario: Duration from API field
- **WHEN** the audio item has a `duration` field
- **THEN** the card shows that duration formatted as `m:ss`

#### Scenario: Duration from audio metadata
- **WHEN** no `duration` field is available but audio has loaded
- **THEN** the card updates to show the duration derived from `<audio>.duration`

#### Scenario: Duration not yet known
- **WHEN** neither API field nor metadata is available
- **THEN** the duration badge shows "–" as a placeholder

### Requirement: Full action feedback on list interactions
Every user interaction on the mindful minutes pages SHALL produce visible feedback.

#### Scenario: Category filter tap
- **WHEN** user taps a category pill
- **THEN** the selected pill gets an active/filled style and the list animates to show filtered results

#### Scenario: Audio item tap
- **WHEN** user taps an audio item
- **THEN** the card shows a "Now playing" indicator and the fullscreen player opens

#### Scenario: Error state with retry
- **WHEN** data loading fails
- **THEN** an error message is shown with a "Retry" button that triggers revalidation
