## ADDED Requirements

### Requirement: Book-session tasks gated behind premium access
Tasks of type `book` (therapy/session bookings) inside a premium journey SHALL be inaccessible to users without premium access (`progress.canAccessPremium !== true`). Tapping such a task SHALL redirect the user to the specific package that includes this journey, not the generic `/packages` list.

#### Scenario: Free-preview user taps a book-session task
- **WHEN** `isSubscribed && journey.isPremium && !progress.canAccessPremium` and the user taps a `book` type task (even on Day 1)
- **THEN** the app does NOT open `JourneyTaskActionSheet` with a bookable CTA
- **AND** the app navigates to `/packages/{packageId}` where `packageId` is the package that contains this journey
- **AND** if `packageId` is not resolvable, the app falls back to `/packages` with a toast "Upgrade to book sessions"

#### Scenario: Premium-access user taps a book-session task
- **WHEN** `progress.canAccessPremium === true`
- **THEN** the book task behaves normally — navigates to the booking flow via `destinationPath`

### Requirement: Source of related package id
The enrollment response (`PatientJourneyResponseDto`) or the journey CMS object SHALL expose the ID of the package that unlocks premium access for this journey (e.g. `packageId` or `premiumUnlockPackageId`). The frontend SHALL NOT hardcode or derive this mapping.

#### Scenario: Package id present
- **WHEN** the SDK exposes `progress.premiumUnlockPackageId` (or equivalent)
- **THEN** the redirect target is `/packages/{premiumUnlockPackageId}`

#### Scenario: Package id missing
- **WHEN** the field is not present (SDK gap)
- **THEN** frontend falls back to `/packages` and flags the missing field to the user
