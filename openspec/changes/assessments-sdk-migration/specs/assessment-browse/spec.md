## ADDED Requirements

### Requirement: Browse tab fetches all assessments via Strapi SDK + SWR
The page SHALL use `useSWRInfinite` with `getApiV1Assessments` from `sdk/strapi/index.ts` to load assessments in pages of 10. No raw `fetch` or `axios` calls are permitted. All locally defined interfaces that duplicate SDK response shapes SHALL be removed and replaced with SDK-generated types from `sdk/strapi/types.gen.ts`.

#### Scenario: Initial load renders skeleton then assessments
- **WHEN** the browse tab mounts
- **THEN** skeleton cards are shown while SWR fetches, then real assessment cards render once data resolves

#### Scenario: Scroll to bottom loads next page
- **WHEN** the user scrolls to within 500px of the bottom of the list
- **THEN** `useSWRInfinite` fetches the next offset page and appends results

#### Scenario: All pages loaded hides load-more
- **WHEN** a page returns fewer than 10 items
- **THEN** no further fetch is triggered and the loading spinner is hidden

### Requirement: Category filters are derived from API data
Category filter chips SHALL be computed from the union of `category[]` values across all loaded assessments, deduplicated and sorted, with "All" prepended. No hardcoded category list from `constants.ts` is used.

#### Scenario: Filters match API categories
- **WHEN** assessments load with categories `["anxiety", "depression"]`
- **THEN** filter chips show: All · Anxiety · Depression

#### Scenario: Selecting a filter narrows the list
- **WHEN** the user taps the "Anxiety" filter chip
- **THEN** only assessments whose `category[]` includes "anxiety" are shown

### Requirement: Search filters the loaded list client-side
The search input SHALL filter the current in-memory assessment list by matching against `title` and `description` (case-insensitive). No new API call is made on search input change.

#### Scenario: Search matches title
- **WHEN** the user types "GAD" in the search box
- **THEN** only assessments whose title contains "GAD" (case-insensitive) are shown

#### Scenario: No matches shows empty state
- **WHEN** the search term matches zero assessments
- **THEN** an empty-state card with "No assessments found" is shown

### Requirement: Browse list groups assessments into sections
The browse tab SHALL render: (1) a dark "Recommended" hero card for the first PUBLISHED assessment, (2) a "Popular Screenings" section for assessments categorised as anxiety/depression/sleep, (3) a "Personal Growth" section for the rest. Sections with zero items are hidden.

#### Scenario: Recommended card shows first assessment
- **WHEN** assessments load
- **THEN** the first PUBLISHED item renders as the large dark hero card with title, description, duration, and question count

#### Scenario: Empty popular section is hidden
- **WHEN** no assessments have anxiety/depression/sleep categories
- **THEN** the "Popular Screenings" heading and section are not rendered

### Requirement: Assigned assessments tab is SWR-backed
The "My Assessments" tab SHALL wrap `getAssignedAssessments(leadId)` in a `useSWR` call keyed by `['assigned-assessments', leadId]` instead of a bare `useEffect`. The tab SHALL only fetch when the user navigates to it (conditional key: null when userId is absent).

#### Scenario: Tab shows assigned items on load
- **WHEN** the user opens "My Assessments" tab and has assignments in Firestore
- **THEN** assignment cards render with label and status badge

#### Scenario: Empty state shown when no assignments
- **WHEN** Firestore returns an empty assignments array
- **THEN** a "No Assigned Assessments" empty-state card is shown

### Requirement: Dead code and static constants are removed
`app/(auth)/assessments/constants.ts` (containing `ASSESSMENT_DEFINITIONS`, `SECTION_METADATA`, stress option arrays) SHALL be deleted. Any file importing from it SHALL be updated to use API data or removed if itself dead code. All deleted files SHALL be confirmed unused before deletion.

#### Scenario: Build succeeds after constants deletion
- **WHEN** `constants.ts` is deleted
- **THEN** `tsc --noEmit` passes with no import errors referencing that file
