## ADDED Requirements

### Requirement: useJourneys SWR hook
The system SHALL provide a `useJourneys(options?)` hook that fetches the published journey list from Strapi via `getApiV1Journeys` wrapped in SWR, returning `{ journeys, isLoading, error }`.

#### Scenario: Returns journey list
- **WHEN** `useJourneys()` is called
- **THEN** it SHALL return the list of published `JourneyItem` objects from Strapi once loaded

#### Scenario: Returns loading state
- **WHEN** data is still being fetched
- **THEN** `isLoading` SHALL be `true` and `journeys` SHALL be an empty array

### Requirement: useJourneyDetail SWR hook
The system SHALL provide a `useJourneyDetail(id)` hook that fetches a single journey by ID from Strapi via `getApiV1JourneysById` wrapped in SWR, returning `{ journey, isLoading, error }`.

#### Scenario: Returns journey detail
- **WHEN** `useJourneyDetail(id)` is called with a valid ID
- **THEN** it SHALL return the full `JourneyItem` including steps and tasks

#### Scenario: Returns null for invalid ID
- **WHEN** `useJourneyDetail(id)` is called with a non-existent ID
- **THEN** `journey` SHALL be `null` and `error` SHALL be set

### Requirement: useJourneyProgress SWR hook
The system SHALL provide a `useJourneyProgress(journeyId)` hook that reads the user's progress for a specific journey from Firebase RTDB at `userJourneysMobile/{mobile}/journeys/{journeyId}`, returning `{ progress, isLoading, error }` where `progress` includes `currentDay`, `streak`, `gems`, `completedNodeIds`, and `isPremium`.

#### Scenario: Returns user progress
- **WHEN** the user is authenticated and has progress data in Firebase RTDB
- **THEN** progress fields SHALL reflect the stored values

#### Scenario: Returns null when not subscribed
- **WHEN** the user has no entry for the journey in Firebase RTDB
- **THEN** `progress` SHALL be `null`

### Requirement: subscribeToJourney action
The system SHALL provide a `subscribeToJourney(journeyId, journeyMeta)` async function exported from the hook that writes the initial subscription record to Firebase RTDB at `userJourneysMobile/{mobile}/journeys/{journeyId}` and triggers SWR revalidation.

#### Scenario: Subscribe writes to Firebase
- **WHEN** `subscribeToJourney` is called with valid args and the user is authenticated
- **THEN** a record SHALL be written to Firebase RTDB with `currentDay: 1`, `streak: 0`, `gems: 0`, `progress: 0`, `startDate`, and `isPremium` fields

#### Scenario: Subscribe revalidates SWR cache
- **WHEN** `subscribeToJourney` completes successfully
- **THEN** the `useJourneyProgress` SWR key for that journey SHALL be revalidated

### Requirement: updateNodeProgress action
The system SHALL provide an `updateNodeProgress(journeyId, nodeId)` async function that marks a task node as complete in Firebase RTDB, increments gems, and updates streak/progress.

#### Scenario: Node marked complete
- **WHEN** `updateNodeProgress` is called
- **THEN** the node ID SHALL be added to `completedNodeIds` in Firebase RTDB and `progress` SHALL be recalculated

#### Scenario: Gems incremented
- **WHEN** a node is marked complete
- **THEN** the `gems` value in Firebase SHALL be incremented by a fixed amount (10 gems per node)

### Requirement: SWR key factory for journeys
The system SHALL define SWR cache keys in `lib/swr-keys.ts`: `journeysKey()`, `journeyDetailKey(id)`, `journeyProgressKey(mobile, journeyId)`.

#### Scenario: Keys are stable
- **WHEN** the same arguments are passed to each key function
- **THEN** the returned string SHALL be identical across calls (pure function)
