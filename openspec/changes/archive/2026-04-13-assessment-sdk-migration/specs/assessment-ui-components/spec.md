## ADDED Requirements

### Requirement: Assessment components co-located under components/assessment
All assessment-specific UI components SHALL live under `components/assessment/`. Components currently in `components/appointments/` that are assessment-specific SHALL be moved.

#### Scenario: Component relocation
- **WHEN** the migration is complete
- **THEN** the following files SHALL exist under `components/assessment/`: `assessment-card.tsx`, `assessment-skeletons.tsx`, `assessment-empty-state.tsx`, `assessment-category.ts`, `assignments-list.tsx`
- **AND** `components/appointments/` SHALL NOT contain any assessment-prefixed files

### Requirement: AssessmentCard component
The `AssessmentCard` component SHALL render an assessment item with category icon, title, hint category badge, and duration badge. It SHALL accept `assessment: AssessmentItem` and `onClick` props.

#### Scenario: Card with category and duration
- **WHEN** an `AssessmentCard` renders an assessment with category "anxiety" and 5 minutes duration
- **THEN** it SHALL display the category icon, title, "Anxiety" badge, and "5 min" badge with a chevron-right action indicator

### Requirement: RecommendedAssessmentCard component
The `RecommendedAssessmentCard` SHALL render a dark gradient hero card with "Recommended" badge, title, description, duration, and question count.

#### Scenario: Recommended card display
- **WHEN** a `RecommendedAssessmentCard` renders
- **THEN** it SHALL show a dark gradient card with white text, "Recommended" label, assessment title, description, duration and question count stats

### Requirement: Assessment skeleton components
`BrowseSkeleton` and `AssignmentsSkeleton` SHALL provide loading placeholder UI matching the layout of their respective content.

#### Scenario: Browse loading state
- **WHEN** assessments are loading
- **THEN** `BrowseSkeleton` SHALL render placeholder cards matching the layout of `AssessmentCard` items

### Requirement: AssessmentEmptyState component
The `AssessmentEmptyState` SHALL accept a `variant` prop of `"no-results"` or `"no-assignments"` and render the appropriate empty state message.

#### Scenario: No search results
- **WHEN** `variant="no-results"` is passed
- **THEN** it SHALL display a message indicating no assessments match the search

#### Scenario: No assignments
- **WHEN** `variant="no-assignments"` is passed
- **THEN** it SHALL display a message indicating no assigned assessments

### Requirement: AssignmentsList component
The `AssignmentsList` SHALL render a list of assigned assessment items with completion status and click handling.

#### Scenario: Rendering assignments
- **WHEN** `AssignmentsList` receives a list of assigned assessments
- **THEN** it SHALL render each item showing title, category, completion status, and handle clicks via the `onItemClick` callback

### Requirement: Category configuration
The `assessment-category.ts` file SHALL export `ASSESSMENT_CATEGORIES`, `categoryMap`, and `getCategoryInfo` for mapping assessment categories to icons and colors.

#### Scenario: Category lookup
- **WHEN** `getCategoryInfo(assessment)` is called with an assessment that has category "anxiety"
- **THEN** it SHALL return the matching icon component, background color, and text color
