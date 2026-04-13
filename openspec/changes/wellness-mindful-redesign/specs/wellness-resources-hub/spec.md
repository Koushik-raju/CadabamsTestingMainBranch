## ADDED Requirements

### Requirement: SWR hook for wellness resources list
The system SHALL provide a `useWellnessResources` hook in `hooks/use-wellness-resources.ts` that fetches the blogs list via the Strapi SDK (or SDK-compatible client wrapper) and returns `{ resources, categories, isLoading, error, mutate }`.

#### Scenario: Successful data load
- **WHEN** the hook mounts
- **THEN** it fetches resources from the Strapi blogs endpoint and populates `resources` with the array of `WellnessResource` items and `categories` with unique category strings derived from the response, with "All" always first

#### Scenario: Load failure
- **WHEN** the fetch fails
- **THEN** `error` is non-null and `resources` is an empty array

#### Scenario: Cache deduplication
- **WHEN** two components mount with the same SWR key simultaneously
- **THEN** only one network request is made

### Requirement: SWR hook for wellness resource detail
The system SHALL provide a `useWellnessResourceDetail(slug)` hook that fetches a single blog by slug via the Strapi SDK and returns `{ resource, isLoading, error }`.

#### Scenario: Successful detail load
- **WHEN** a valid slug is provided
- **THEN** `resource` is populated with the full `WellnessResource` object including `similarBlogs`

#### Scenario: Not found
- **WHEN** the slug returns no data
- **THEN** `error` is set to a user-friendly "Resource not found" message

### Requirement: API-driven category filters on list page
The system SHALL derive all category filter options from the API response on the wellness resources list page. No category values SHALL be hardcoded in the component.

#### Scenario: Categories populated from API
- **WHEN** resources load successfully
- **THEN** the `CategoryFilter` component receives a list built from unique `category` values across all resources, with "All" prepended

#### Scenario: Single category in data
- **WHEN** all resources share one category
- **THEN** the category filter shows only "All" and that one category

### Requirement: Functional search on list page
The system SHALL filter the displayed resources in real-time as the user types in the search input, matching against `title` and `description` fields.

#### Scenario: Search filters results
- **WHEN** the user types a search term
- **THEN** only resources whose `title` or `description` contains the term (case-insensitive) are shown

#### Scenario: Empty search
- **WHEN** the search input is cleared
- **THEN** all resources matching the current category filter are shown

### Requirement: Loading and error states on list page
The list page SHALL display skeleton cards while loading and an error message with a retry button if the fetch fails.

#### Scenario: Loading state
- **WHEN** `isLoading` is true
- **THEN** 6 skeleton card placeholders are shown in a grid layout

#### Scenario: Error state
- **WHEN** `error` is non-null
- **THEN** an error message and a "Retry" button are displayed; tapping Retry re-triggers the SWR revalidation

### Requirement: No raw fetch calls in wellness-resources pages
All network calls in `app/(auth)/wellness-resources/` SHALL go through the Strapi SDK or SDK-compatible client — no direct calls to `fetch('https://mindtalkbuddy.com/api/...')`.

#### Scenario: SDK call used for list
- **WHEN** the list page fetches resources
- **THEN** the request originates from the SDK client (base URL from SDK config, not hardcoded)

#### Scenario: SDK call used for detail
- **WHEN** the detail page fetches a resource by slug
- **THEN** the request originates from the SDK client

### Requirement: Pagination on wellness resources list
The list page SHALL support pagination if the API returns a `pagination` object, showing a "Load more" button or infinite scroll.

#### Scenario: Load more
- **WHEN** more resources exist beyond the current page
- **THEN** a "Load more" button is visible and fetches the next page when tapped

#### Scenario: All loaded
- **WHEN** the last page has been loaded
- **THEN** the "Load more" button is hidden
