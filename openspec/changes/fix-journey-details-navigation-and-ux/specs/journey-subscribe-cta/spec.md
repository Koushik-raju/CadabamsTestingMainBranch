## ADDED Requirements

### Requirement: Subscribe button shown for unsubscribed users on free journeys
When `progress` is `null` and `journey.isPremium` is `false`, the page SHALL show a sticky footer button labelled "Start Free Journey →" that calls `subscribeToJourney`. After the call resolves, the SWR cache updates automatically (via `replaceCache` inside the hook) and the footer disappears.

#### Scenario: Unsubscribed user on a free journey sees the CTA
- **WHEN** `progress` is `null` and `journey.isPremium` is `false`
- **THEN** a sticky footer with "Start Free Journey →" is visible
- **AND** tapping it calls `subscribeToJourney(journey)` with a loading spinner while in-flight

#### Scenario: Subscribe succeeds
- **WHEN** `subscribeToJourney` resolves without error
- **THEN** `progress` is non-null (SWR cache updated), the footer disappears, and the task path is now interactive

#### Scenario: Subscribe fails
- **WHEN** `subscribeToJourney` throws an error
- **THEN** the button returns to idle state and a toast shows "Something went wrong. Try again."

### Requirement: Premium journey CTA directs to packages
When `journey.isPremium` is `true` and the user is not subscribed, the sticky footer SHALL show "Unlock Premium Journey" which opens the premium sheet (existing behaviour — no change needed).

#### Scenario: Unsubscribed user on a premium journey
- **WHEN** `progress` is `null` and `journey.isPremium` is `true`
- **THEN** the footer shows "Unlock Premium Journey" which opens `premiumSheetOpen`
