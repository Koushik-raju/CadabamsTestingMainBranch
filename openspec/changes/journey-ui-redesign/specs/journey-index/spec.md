## ADDED Requirements

### Requirement: Explore Journeys index page
The system SHALL render an "Explore Journeys" page at `/journeys` with a top app-bar (back arrow + title + search icon), a "Recommended for You" assessment-result banner, horizontal category filter chips, a Featured Journey hero card, and a "Quick Picks" grid.

#### Scenario: Page loads with all sections
- **WHEN** a user navigates to `/journeys`
- **THEN** the page SHALL display the app-bar, recommendation banner, category chips, featured journey card, and quick-picks grid in vertical order

#### Scenario: Category filter chips
- **WHEN** the page loads
- **THEN** chips for All, Anxiety, Sleep, Depression SHALL be visible in a horizontally scrollable row with "All" selected by default

#### Scenario: Filtering by category
- **WHEN** a user taps a category chip
- **THEN** the quick-picks grid SHALL re-filter to show only journeys matching that category, and the tapped chip SHALL appear as active (filled background)

### Requirement: Recommendation banner
The system SHALL show a "Recommended for You" banner card beneath the app-bar that displays a message derived from the user's latest assessment result (e.g. "Based on your anxiety assessment, we found 3 journeys that might help.") with a chevron to navigate to filtered results.

#### Scenario: Banner visible when assessment result exists
- **WHEN** the user has at least one completed assessment stored in Firebase
- **THEN** the banner SHALL be visible with a relevant category message

#### Scenario: Banner hidden when no assessment result
- **WHEN** the user has no completed assessments
- **THEN** the banner SHALL not be rendered

### Requirement: Featured Journey hero card
The system SHALL display the first (or manually featured) journey as a large hero card with a "Trending" badge overlay, journey image background, duration/level badges at the bottom, title, short description, and a "Start Now →" CTA button.

#### Scenario: Hero card renders
- **WHEN** at least one journey exists in Strapi
- **THEN** the first journey SHALL be rendered as a full-width hero card with image, Trending badge, title, description, and Start Now button

#### Scenario: Start Now navigates to details
- **WHEN** a user taps "Start Now →" on the featured card
- **THEN** the app SHALL navigate to `/journeys/[id]/details`

### Requirement: Quick Picks grid
The system SHALL display remaining journeys (excluding the featured one) in a 2-column grid. Each card SHALL show the journey thumbnail, name, day count, and media type tag (e.g. "Audio", "Interactive", "Journal"). A "Filters" button SHALL appear next to the section header.

#### Scenario: Grid card tap
- **WHEN** a user taps a quick-pick card
- **THEN** the app SHALL navigate to `/journeys/[id]/details`

#### Scenario: Loading state
- **WHEN** journeys are being fetched
- **THEN** skeleton placeholder cards SHALL be shown in the grid and hero positions
