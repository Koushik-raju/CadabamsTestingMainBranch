## ADDED Requirements

### Requirement: Unified assessment hook file
All assessment data fetching, submission, and data manipulation logic SHALL be consolidated into a single file `hooks/use-assessments.ts`. The file SHALL export individual named hooks and helper functions.

#### Scenario: Hook file exports
- **WHEN** a developer imports from `hooks/use-assessments.ts`
- **THEN** the following exports SHALL be available: `useAssessments`, `useAssessmentById`, `useAssignedAssessments`, `useAssessmentSubmissions`, `useFilteredAssessments`, `submitAssessment`, `mapStrapiAssessment`, `categorizeAssessments`, `AssessmentItem` type

### Requirement: Browse assessments via SDK
The `useAssessments` hook SHALL fetch published assessments using `getApiV1Assessments` from the Strapi SDK with SWR infinite pagination. It SHALL NOT use raw fetch or backendClient.

#### Scenario: Loading paginated assessments
- **WHEN** `useAssessments({ limit: 10, status: 'PUBLISHED' })` is called
- **THEN** it SHALL call `getApiV1Assessments` with `{ query: { limit: 10, offset: 0, status: 'PUBLISHED', visibleToAll: true, forJourney: false } }` and return mapped `AssessmentItem[]` pages via SWR infinite

#### Scenario: Loading next page
- **WHEN** `setSize` is called to increment page
- **THEN** it SHALL call `getApiV1Assessments` with the next offset and append results

### Requirement: Assessment by ID via SDK
The `useAssessmentById` hook SHALL fetch a single assessment using `getApiV1AssessmentsById` from the Strapi SDK.

#### Scenario: Fetching assessment details
- **WHEN** `useAssessmentById("abc123")` is called
- **THEN** it SHALL call `getApiV1AssessmentsById({ path: { id: "abc123" } })` and return a mapped `AssessmentItem`

#### Scenario: Null ID returns no data
- **WHEN** `useAssessmentById(null)` is called
- **THEN** it SHALL not fetch and return `{ data: undefined, isLoading: false }`

### Requirement: Filtered search via SDK
The `useFilteredAssessments` hook SHALL fetch assessments matching a search query or category filter using `getApiV1Assessments`.

#### Scenario: Search by term
- **WHEN** `useFilteredAssessments("anxiety")` is called
- **THEN** it SHALL call `getApiV1Assessments` with `{ query: { search: "anxiety", limit: 50, offset: 0, status: 'PUBLISHED', visibleToAll: true, forJourney: false } }` and return filtered `AssessmentItem[]`

#### Scenario: No query returns null
- **WHEN** `useFilteredAssessments(null)` is called
- **THEN** it SHALL not fetch and return `{ data: undefined }`

### Requirement: Assigned assessments from Firebase
The `useAssignedAssessments` hook SHALL fetch assigned assessments from Firestore `patient_assignments/{leadId}` collection and check completion status from Firebase RTDB.

#### Scenario: User has assigned assessments
- **WHEN** `useAssignedAssessments("lead123")` is called and the user has 3 assigned assessments
- **THEN** it SHALL return an array of 3 `AssignedAssessmentItem` objects with `isCompleted` and `lastUsed` fields populated from RTDB

#### Scenario: No lead ID
- **WHEN** `useAssignedAssessments(null)` is called
- **THEN** it SHALL not fetch and return `{ data: undefined }`

### Requirement: Assessment submissions from Firebase
The `useAssessmentSubmissions` hook SHALL fetch submission history from Firebase RTDB at `assessments/{leadId}/{assessmentId}`.

#### Scenario: User has submissions
- **WHEN** `useAssessmentSubmissions("lead123", "assess456")` is called
- **THEN** it SHALL return submissions sorted by date descending with score summary derived from numeric answers

### Requirement: Submit assessment function
The `submitAssessment` function SHALL save assessment responses to both Firebase RTDB and the backend API.

#### Scenario: Successful submission
- **WHEN** `submitAssessment(leadId, assessmentId, answers)` is called
- **THEN** it SHALL push to Firebase RTDB at `assessments/{leadId}/{assessmentId}` AND post to the backend `saveAssessment` endpoint

### Requirement: Data manipulation in hook
The `mapStrapiAssessment` function SHALL transform raw Strapi response items into `AssessmentItem` type. The `categorizeAssessments` function SHALL split assessments into `recommendedAssessment`, `popularScreenings`, and `personalGrowth` groups.

#### Scenario: Mapping Strapi response
- **WHEN** `mapStrapiAssessment(rawItem)` is called with a Strapi assessment object
- **THEN** it SHALL return an `AssessmentItem` with `title` derived from `landingTitle.title || label || title`, and all nested fields properly mapped

#### Scenario: Categorizing assessments
- **WHEN** `categorizeAssessments(items)` is called with a list of assessments
- **THEN** it SHALL return `{ recommendedAssessment, popularScreenings, personalGrowth }` with the first item as recommended, and remaining split by category keywords (anxiety/depression/stress/sleep → popular, others → growth)

### Requirement: Remove use-assigned-assessments hook
The `hooks/use-assigned-assessments.ts` file SHALL be deleted. All imports SHALL be updated to use `useAssignedAssessments` from `hooks/use-assessments.ts`.

#### Scenario: Old hook removed
- **WHEN** the migration is complete
- **THEN** `hooks/use-assigned-assessments.ts` SHALL NOT exist and all prior importers SHALL import from `hooks/use-assessments.ts`
